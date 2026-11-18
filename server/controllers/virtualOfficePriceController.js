import mongoose from "mongoose";
import VirtualOfficePrice from "../models/VirtualOfficePrice.js";

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
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
