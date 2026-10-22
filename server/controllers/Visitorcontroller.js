import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import Space from "../models/Space.js";
import WorkspaceBooking from "../models/WorkspaceBooking.js";
import Visitor from "../models/Visitor.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// CONFIG
// ==========================================

const GST_PERCENT = 18;
const MAX_ATTENDEES = 20;

// Hours charged per visitor for daily and monthly bookings
// (one office day). Hourly bookings use the booked duration instead.
// Change this if your visitor pass should cover a different period.
const FULL_DAY_VISIT_HOURS = 11;

// ==========================================
// HELPERS
// ==========================================

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

// Best-effort company lookup. Uses the already registered User model,
// so no import path is needed. Adjust the field names to match your schema.
const getCompanyName = async (userId) => {
  const User = mongoose.models.User;

  if (!User) return "";

  const user = await User.findById(userId).lean();
  const value = user?.companyName ?? user?.company;

  return typeof value === "string" ? value : "";
};

// Current hourly rate per workspace name (used for daily/monthly bookings).
const getHourlyRates = async (bookings) => {
  const names = [
    ...new Set(
      bookings
        .filter((booking) => booking.plan !== "hourly")
        .map((booking) => booking.spaceName)
    ),
  ];

  const rates = new Map();

  if (names.length === 0) return rates;

  const spaces = await Space.find({
    space: { $in: names },
    status: "Active",
  })
    .select("space perHour")
    .lean();

  for (const space of spaces) {
    const rate = Number(space.perHour);

    if (Number.isFinite(rate) && rate > 0 && !rates.has(space.space)) {
      rates.set(space.space, rate);
    }
  }

  return rates;
};

// Returns { hourlyRate, visitHours } or null if visitors cannot be
// charged for this booking (e.g. the space has no hourly rate).
const getVisitTerms = (booking, hourlyRates) => {
  if (booking.plan === "hourly") {
    const rate = Number(booking.pricePerUnit);
    const hours = Number(booking.duration);

    if (!Number.isFinite(rate) || rate <= 0 || !(hours >= 1)) return null;

    return { hourlyRate: rate, visitHours: hours };
  }

  const rate = hourlyRates.get(booking.spaceName);

  if (!rate) return null;

  return { hourlyRate: rate, visitHours: FULL_DAY_VISIT_HOURS };
};

// All maths in paise to avoid floating point errors.
const calculatePricing = (hourlyRate, visitHours, attendees) => {
  const ratePaise = Math.round(hourlyRate * 100);
  const subtotalPaise = ratePaise * visitHours * attendees;
  const gstPaise = Math.round((subtotalPaise * GST_PERCENT) / 100);
  const totalPaise = subtotalPaise + gstPaise;

  return {
    subtotal: subtotalPaise / 100,
    gstAmount: gstPaise / 100,
    totalAmount: totalPaise / 100,
    totalPaise,
  };
};

const validateVisitorInput = (body) => {
  const { bookingId, attendees, name, contact, email, reason } = body;

  if (!isNonEmptyString(bookingId)) {
    throw new Error("Please select a booking");
  }

  const numericAttendees = Number(attendees);

  if (
    !Number.isInteger(numericAttendees) ||
    numericAttendees < 1 ||
    numericAttendees > MAX_ATTENDEES
  ) {
    throw new Error(
      `Attendees must be between 1 and ${MAX_ATTENDEES}`
    );
  }

  if (!isNonEmptyString(name) || name.trim().length < 2) {
    throw new Error("Visitor name is required");
  }

  if (name.trim().length > 80) {
    throw new Error("Visitor name is too long");
  }

  if (typeof contact !== "string" || !/^[6-9]\d{9}$/.test(contact)) {
    throw new Error("Enter a valid 10-digit mobile number");
  }

  const cleanEmail = typeof email === "string" ? email.trim() : "";

  if (
    cleanEmail &&
    (cleanEmail.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
  ) {
    throw new Error("Enter a valid email address");
  }

  const cleanReason = typeof reason === "string" ? reason.trim() : "";

  if (cleanReason.length > 300) {
    throw new Error("Reason must be 300 characters or less");
  }

  return {
    bookingId: bookingId.trim(),
    attendees: numericAttendees,
    name: name.trim(),
    contact,
    email: cleanEmail,
    reason: cleanReason,
  };
};

// A booking can have visitors only if it belongs to this user,
// is paid and confirmed, and has not ended yet.
const getInvitableBooking = async (bookingId, userId) => {
  const booking = await WorkspaceBooking.findOne({
    bookingId,
    user: userId,
    status: "Confirmed",
    paymentStatus: "Paid",
    endAt: { $gt: new Date() },
  });

  if (!booking) {
    throw new Error(
      "Booking not found, not confirmed, or already ended"
    );
  }

  return booking;
};

// ==========================================
// GET UPCOMING BOOKINGS
// GET /api/visitor/upcoming_bookings
// ==========================================

export const getUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookings = await WorkspaceBooking.find({
      user: userId,
      status: "Confirmed",
      paymentStatus: "Paid",
      endAt: { $gt: new Date() },
    })
      .select(
        "bookingId spaceName selectedSpaces plan bookingDate duration pricePerUnit startTime endTime startAt endAt"
      )
      .sort({ startAt: 1 })
      .lean();

    const [hourlyRates, companyName] = await Promise.all([
      getHourlyRates(bookings),
      getCompanyName(userId),
    ]);

    const result = [];

    for (const booking of bookings) {
      const terms = getVisitTerms(booking, hourlyRates);

      // Skip bookings where a visitor fee cannot be worked out.
      if (!terms) continue;

      result.push({
        bookingId: booking.bookingId,
        spaceName: booking.spaceName,
        selectedSpaces: booking.selectedSpaces,
        plan: booking.plan,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime || null,
        endTime: booking.endTime || null,
        startAt: booking.startAt,
        endAt: booking.endAt,
        hourlyRate: terms.hourlyRate,
        visitHours: terms.visitHours,
      });
    }

    return res.status(200).json({
      success: true,
      companyName,
      bookings: result,
    });
  } catch (error) {
    console.error("Get upcoming bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming bookings",
    });
  }
};

// ==========================================
// CREATE RAZORPAY ORDER FOR A VISITOR
// POST /api/visitor/create_razorpay_order
// ==========================================

export const createVisitorOrder = async (req, res) => {
  let visitor = null;

  try {
    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    const input = validateVisitorInput(req.body);

    const booking = await getInvitableBooking(
      input.bookingId,
      req.user.id
    );

    // Never trust an amount sent by the client.
    const hourlyRates = await getHourlyRates([booking]);
    const terms = getVisitTerms(booking, hourlyRates);

    if (!terms) {
      throw new Error(
        "Visitor pricing is not available for this workspace"
      );
    }

    const pricing = calculatePricing(
      terms.hourlyRate,
      terms.visitHours,
      input.attendees
    );

    if (
      !Number.isSafeInteger(pricing.totalPaise) ||
      pricing.totalPaise < 100
    ) {
      throw new Error("Invalid visitor amount");
    }

    const companyName = await getCompanyName(req.user.id);

    const visitId = `VIS-${new mongoose.Types.ObjectId()
      .toString()
      .toUpperCase()}`;

    // Create a pending record before creating the payment order.
    visitor = await Visitor.create({
      visitId,
      user: req.user.id,
      bookingId: booking.bookingId,
      spaceName: booking.spaceName,
      selectedSpaces: booking.selectedSpaces,
      bookingStartAt: booking.startAt,
      bookingEndAt: booking.endAt,
      name: input.name,
      contact: input.contact,
      email: input.email,
      companyName,
      reason: input.reason,
      attendees: input.attendees,
      hourlyRate: terms.hourlyRate,
      visitHours: terms.visitHours,
      subtotal: pricing.subtotal,
      gstAmount: pricing.gstAmount,
      totalAmount: pricing.totalAmount,
      totalPaise: pricing.totalPaise,
      paymentStatus: "Pending",
      status: "Pending",
    });

    const order = await razorpay.orders.create({
      amount: pricing.totalPaise,
      currency: "INR",
      receipt: visitId,
      notes: {
        visitId,
        bookingId: booking.bookingId,
        userId: String(req.user.id),
      },
    });

    visitor.razorpayOrderId = order.id;
    await visitor.save();

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      visitId: visitor.visitId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      totalAmount: pricing.totalAmount,
    });
  } catch (error) {
    console.error("Create visitor order error:", error);

    // Remove the temporary record if order creation failed.
    if (visitor && !visitor.razorpayOrderId) {
      await Visitor.deleteOne({ _id: visitor._id }).catch(
        (cleanupError) =>
          console.error("Visitor cleanup error:", cleanupError.message)
      );
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
};

// ==========================================
// CONFIRM VISITOR PAYMENT
// POST /api/visitor/confirm_payment
// ==========================================

export const confirmVisitorPayment = async (req, res) => {
  try {
    const {
      visitId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (
      !isNonEmptyString(visitId) ||
      !isNonEmptyString(razorpayOrderId) ||
      !isNonEmptyString(razorpayPaymentId) ||
      !isNonEmptyString(razorpaySignature)
    ) {
      return res.status(400).json({
        success: false,
        message: "All payment verification fields are required",
      });
    }

    const visitor = await Visitor.findOne({
      visitId,
      user: req.user.id,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor record not found",
      });
    }

    if (
      visitor.status === "Confirmed" &&
      visitor.paymentStatus === "Paid"
    ) {
      if (visitor.razorpayPaymentId === razorpayPaymentId) {
        return res.status(200).json({
          success: true,
          message: "Visitor pass already confirmed",
          visit: visitor,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This visitor pass has already been paid",
      });
    }

    if (
      visitor.status !== "Pending" ||
      visitor.paymentStatus !== "Pending" ||
      visitor.razorpayOrderId !== razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired visitor order",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const signatureBuffer = Buffer.from(razorpaySignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Confirm the payment against Razorpay's API as well.
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (
      payment.order_id !== razorpayOrderId ||
      payment.status !== "captured" ||
      payment.amount !== visitor.totalPaise ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or amount does not match",
      });
    }

    // The booking must still be confirmed when the payment completes.
    const booking = await WorkspaceBooking.findOne({
      bookingId: visitor.bookingId,
      user: req.user.id,
      status: "Confirmed",
      paymentStatus: "Paid",
    }).select("_id");

    if (!booking) {
      return res.status(409).json({
        success: false,
        message:
          "Payment succeeded, but the workspace booking is no longer active. Contact support for a refund.",
        paymentId: razorpayPaymentId,
      });
    }

    visitor.razorpayPaymentId = razorpayPaymentId;
    visitor.paymentStatus = "Paid";
    visitor.status = "Confirmed";

    try {
      await visitor.save();
    } catch (saveError) {
      // Duplicate payment id: this payment was already used.
      if (saveError?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "This payment has already been used",
        });
      }

      throw saveError;
    }

    return res.status(200).json({
      success: true,
      message: "Visitor pass confirmed successfully",
      visit: visitor,
    });
  } catch (error) {
    console.error("Confirm visitor payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm visitor payment",
    });
  }
};

// ==========================================
// GET MY VISITORS
// GET /api/visitor/my_visitors
// ==========================================

export const getMyVisitors = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const visitors = await Visitor.find({ user: userId })
      .select(
        "visitId bookingId spaceName selectedSpaces bookingStartAt bookingEndAt name contact email companyName reason attendees hourlyRate visitHours subtotal gstAmount totalAmount paymentStatus status createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error("Get my visitors error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch visitors",
    });
  }
};

// ==========================================
// GET ALL VISITORS (ADMIN)
// GET /api/visitor/all_visitors
// ==========================================
 
export const getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate("user", "name email phone")
      .select(
        "visitId user bookingId spaceName selectedSpaces bookingStartAt bookingEndAt name contact email companyName reason attendees hourlyRate visitHours subtotal gstAmount totalAmount paymentStatus status razorpayOrderId razorpayPaymentId createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();
 
    return res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error("Get all visitors error:", error);
 
    return res.status(500).json({
      success: false,
      message: "Failed to fetch visitors",
    });
  }
};