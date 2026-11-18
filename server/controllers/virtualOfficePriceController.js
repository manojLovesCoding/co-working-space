import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import VirtualOfficePrice from "../models/VirtualOfficePrice.js";
import VirtualOfficePurchase from "../models/VirtualOfficePurchase.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const VIRTUAL_OFFICE_VALIDITY_MONTHS = 11;

const toPaise = (rupees) => Math.round(Number(rupees) * 100);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const formatPrice = (price) => {
  const basePrice = Number(price.basePrice);
  const gstRate = Number(price.gstRate);

  const gstAmount = Number(((basePrice * gstRate) / 100).toFixed(2));
  const totalPrice = Number((basePrice + gstAmount).toFixed(2));

  return {
    ...price,
    gstAmount,
    totalPrice,
  };
};

const addMonths = (date, months) => {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDayOfTargetMonth));

  return result;
};

// GET ALL VIRTUAL OFFICE PRICES - ADMIN ONLY
export const getVirtualOfficePrices = async (req, res) => {
  try {
    const prices = await VirtualOfficePrice.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: prices.length,
      prices: prices.map(formatPrice),
    });
  } catch (error) {
    console.error("Get virtual office prices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch virtual office prices.",
    });
  }
};

// CREATE VIRTUAL OFFICE PRICE - ADMIN ONLY
export const createVirtualOfficePrice = async (req, res) => {
  try {
    const { planName, description, basePrice, gstRate = 18 } = req.body;

    if (!planName?.trim() || basePrice === undefined || basePrice === "") {
      return res.status(400).json({
        success: false,
        message: "Plan name and base price are required.",
      });
    }

    const price = Number(basePrice);
    const gst = Number(gstRate);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(gst) ||
      gst < 0 ||
      gst > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid price and GST values.",
      });
    }

    const virtualOfficePrice = await VirtualOfficePrice.create({
      planName: planName.trim(),
      description: description?.trim() || "",
      basePrice: price,
      gstRate: gst,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Virtual office price created successfully.",
      price: formatPrice(virtualOfficePrice.toObject()),
    });
  } catch (error) {
    console.error("Create virtual office price error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create virtual office price.",
    });
  }
};

// UPDATE VIRTUAL OFFICE PRICE - ADMIN ONLY
export const updateVirtualOfficePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, description, basePrice, gstRate } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price ID.",
      });
    }

    if (!planName?.trim() || basePrice === undefined || basePrice === "") {
      return res.status(400).json({
        success: false,
        message: "Plan name and base price are required.",
      });
    }

    const price = Number(basePrice);
    const gst = Number(gstRate);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(gst) ||
      gst < 0 ||
      gst > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid price and GST values.",
      });
    }

    const updatedPrice = await VirtualOfficePrice.findByIdAndUpdate(
      id,
      {
        planName: planName.trim(),
        description: description?.trim() || "",
        basePrice: price,
        gstRate: gst,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!updatedPrice) {
      return res.status(404).json({
        success: false,
        message: "Virtual office price not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Virtual office price updated successfully.",
      price: formatPrice(updatedPrice),
    });
  } catch (error) {
    console.error("Update virtual office price error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update virtual office price.",
    });
  }
};

// ACTIVATE / DEACTIVATE VIRTUAL OFFICE PRICE - ADMIN ONLY
export const toggleVirtualOfficePriceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price ID.",
      });
    }

    const price = await VirtualOfficePrice.findById(id);

    if (!price) {
      return res.status(404).json({
        success: false,
        message: "Virtual office price not found.",
      });
    }

    price.isActive = !price.isActive;
    await price.save();

    return res.status(200).json({
      success: true,
      message: `Price plan ${price.isActive ? "activated" : "deactivated"} successfully.`,
      price: formatPrice(price.toObject()),
    });
  } catch (error) {
    console.error("Toggle virtual office price error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update price status.",
    });
  }
};

// GET ACTIVE VIRTUAL OFFICE PRICES - PUBLIC
export const getPublicVirtualOfficePrices = async (req, res) => {
  try {
    const prices = await VirtualOfficePrice.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: prices.length,
      prices: prices.map(formatPrice),
    });
  } catch (error) {
    console.error("Get public virtual office prices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch virtual office prices.",
    });
  }
};

// CREATE RAZORPAY ORDER - CUSTOMER ONLY
export const createVirtualOfficeOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured on the server.",
      });
    }

    const { planId } = req.body;

    if (!planId || !isValidObjectId(planId)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid Virtual Office plan ID.",
      });
    }

    const plan = await VirtualOfficePrice.findOne({
      _id: planId,
      isActive: true,
    }).lean();

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Virtual Office plan not found or inactive.",
      });
    }

    const basePrice = Number(plan.basePrice);
    const gstRate = Number(plan.gstRate);
    const gstAmount = Number(((basePrice * gstRate) / 100).toFixed(2));
    const totalAmount = Number((basePrice + gstAmount).toFixed(2));

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "This plan has an invalid payment amount.",
      });
    }

    const purchase = await VirtualOfficePurchase.create({
      customer: req.user.id,
      virtualOfficePrice: plan._id,
      planSnapshot: {
        planName: plan.planName,
        description: plan.description || "",
      },
      basePrice,
      gstRate,
      gstAmount,
      totalAmount,
      currency: "INR",
      paymentStatus: "Pending",
      purchaseStatus: "Pending",
    });

    try {
      const order = await razorpay.orders.create({
        amount: toPaise(totalAmount),
        currency: "INR",
        receipt: `VO-${purchase._id}`,
        notes: {
          purchaseId: purchase._id.toString(),
          customerId: req.user.id.toString(),
          planId: plan._id.toString(),
          planName: plan.planName,
        },
      });

      purchase.razorpayOrderId = order.id;
      await purchase.save();

      return res.status(201).json({
        success: true,
        message: "Virtual Office payment order created successfully.",
        purchaseId: purchase._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan: {
          planName: plan.planName,
          basePrice,
          gstRate,
          gstAmount,
          totalAmount,
        },
        validityMonths: VIRTUAL_OFFICE_VALIDITY_MONTHS,
      });
    } catch (razorpayError) {
      purchase.paymentStatus = "Failed";
      await purchase.save();

      throw razorpayError;
    }
  } catch (error) {
    console.error("Create Virtual Office Razorpay order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Virtual Office payment order.",
    });
  }
};

// VERIFY RAZORPAY PAYMENT - CUSTOMER ONLY
export const verifyVirtualOfficePayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured on the server.",
      });
    }

    const {
      purchaseId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (
      !purchaseId ||
      !isValidObjectId(purchaseId) ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Purchase ID and all Razorpay payment details are required.",
      });
    }

    const purchase = await VirtualOfficePurchase.findOne({
      _id: purchaseId,
      customer: req.user.id,
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Virtual Office purchase not found.",
      });
    }

    if (purchase.paymentStatus === "Paid") {
      if (
        purchase.razorpayOrderId === razorpayOrderId &&
        purchase.razorpayPaymentId === razorpayPaymentId
      ) {
        return res.status(200).json({
          success: true,
          message: "Payment has already been verified.",
          purchase,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This purchase has already been paid.",
      });
    }

    if (
      purchase.paymentStatus !== "Pending" ||
      purchase.razorpayOrderId !== razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired payment order.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpaySignature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature.",
      });
    }

    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (
      payment.order_id !== razorpayOrderId ||
      payment.status !== "captured" ||
      payment.amount !== toPaise(purchase.totalAmount) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Payment details do not match.",
      });
    }

    const paymentDate = new Date();
    const expiryDate = addMonths(paymentDate, VIRTUAL_OFFICE_VALIDITY_MONTHS);

    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.razorpaySignature = razorpaySignature;
    purchase.paymentStatus = "Paid";
    purchase.purchaseStatus = "Active";
    purchase.startDate = paymentDate;
    purchase.expiryDate = expiryDate;

    await purchase.save();

    return res.status(200).json({
      success: true,
      message: "Virtual Office payment verified successfully.",
      purchase: {
        _id: purchase._id,
        plan: purchase.planSnapshot,
        basePrice: purchase.basePrice,
        gstRate: purchase.gstRate,
        gstAmount: purchase.gstAmount,
        totalAmount: purchase.totalAmount,
        currency: purchase.currency,
        paymentStatus: purchase.paymentStatus,
        purchaseStatus: purchase.purchaseStatus,
        razorpayOrderId: purchase.razorpayOrderId,
        razorpayPaymentId: purchase.razorpayPaymentId,
        startDate: purchase.startDate,
        expiryDate: purchase.expiryDate,
        validityMonths: VIRTUAL_OFFICE_VALIDITY_MONTHS,
      },
    });
  } catch (error) {
    console.error("Verify Virtual Office payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify Virtual Office payment.",
    });
  }
};


 
// GET LOGGED-IN CUSTOMER'S VIRTUAL OFFICE PURCHASES - CUSTOMER ONLY
export const getMyVirtualOfficePurchases = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Automatically mark active purchases as expired
    // when their expiry date has passed.
    await VirtualOfficePurchase.updateMany(
      {
        customer: customerId,
        purchaseStatus: "Active",
        expiryDate: { $lte: new Date() },
      },
      {
        $set: {
          purchaseStatus: "Expired",
        },
      },
    );

    // Fetch only purchases belonging to the logged-in customer.
    const purchases = await VirtualOfficePurchase.find({
      customer: customerId,
    })
      .select("-razorpaySignature -__v")
      .sort({ createdAt: -1 })
      .lean();

    // Format response using the saved plan snapshot.
    const formattedPurchases = purchases.map((purchase) => ({
      _id: purchase._id,

      plan: {
        planName: purchase.planSnapshot?.planName || "",
        description: purchase.planSnapshot?.description || "",
      },

      basePrice: purchase.basePrice,
      gstRate: purchase.gstRate,
      gstAmount: purchase.gstAmount,
      totalAmount: purchase.totalAmount,
      currency: purchase.currency,

      paymentStatus: purchase.paymentStatus,
      purchaseStatus: purchase.purchaseStatus,

      razorpayOrderId: purchase.razorpayOrderId || null,
      razorpayPaymentId: purchase.razorpayPaymentId || null,

      startDate: purchase.startDate,
      expiryDate: purchase.expiryDate,

      validityMonths: VIRTUAL_OFFICE_VALIDITY_MONTHS,

      purchaseDate: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Virtual Office purchases fetched successfully.",
      count: formattedPurchases.length,
      purchases: formattedPurchases,
    });
  } catch (error) {
    console.error("Get customer Virtual Office purchases error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Virtual Office purchases.",
    });
  }
};



export const getAllVirtualOfficePurchases = async (req, res) => {
  try {
    // Automatically mark expired active purchases as Expired
    await VirtualOfficePurchase.updateMany(
      {
        purchaseStatus: "Active",
        expiryDate: { $lte: new Date() },
      },
      {
        $set: { purchaseStatus: "Expired" },
      }
    );

    // Fetch purchases belonging to all customers
    const purchases = await VirtualOfficePurchase.find()
      .populate("customer", "name email phone phoneNumber")
      .select("-razorpaySignature -__v")
      .sort({ createdAt: -1 })
      .lean();

    const formattedPurchases = purchases.map((purchase) => ({
      _id: purchase._id,

      customer: purchase.customer
        ? {
            _id: purchase.customer._id,
            name: purchase.customer.name || "",
            email: purchase.customer.email || "",
            phone:
              purchase.customer.phone ||
              purchase.customer.phoneNumber ||
              "",
          }
        : null,

      plan: {
        planName: purchase.planSnapshot?.planName || "",
        description: purchase.planSnapshot?.description || "",
      },

      basePrice: purchase.basePrice,
      gstRate: purchase.gstRate,
      gstAmount: purchase.gstAmount,
      totalAmount: purchase.totalAmount,
      currency: purchase.currency,

      paymentStatus: purchase.paymentStatus,
      purchaseStatus: purchase.purchaseStatus,

      razorpayOrderId: purchase.razorpayOrderId || null,
      razorpayPaymentId: purchase.razorpayPaymentId || null,

      startDate: purchase.startDate,
      expiryDate: purchase.expiryDate,

      purchaseDate: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "All customer Virtual Office purchases fetched successfully.",
      count: formattedPurchases.length,
      purchases: formattedPurchases,
    });
  } catch (error) {
    console.error("Get all Virtual Office purchases error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer Virtual Office purchases.",
      error: error.message,
    });
  }
};
