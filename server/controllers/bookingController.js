import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import Space from "../models/Space.js";
import WorkspaceBooking from "../models/WorkspaceBooking.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getPriceField = (plan) => {
  const fields = {
    hourly: "perHour",
    daily: "perDay",
    monthly: "perMonth",
  };

  return fields[plan];
};

const getBookingRange = (bookingDate, plan, duration) => {
  const startAt = new Date(`${bookingDate}T00:00:00.000Z`);

  if (
    Number.isNaN(startAt.getTime()) ||
    startAt.toISOString().slice(0, 10) !== bookingDate
  ) {
    throw new Error("Invalid booking date");
  }

  const endAt = new Date(startAt);

  if (plan === "hourly") {
    // The current BookSpace component does not collect a start time.
    // Therefore, hourly bookings reserve the selected calendar day.
    endAt.setUTCDate(endAt.getUTCDate() + 1);
  } else if (plan === "daily") {
    endAt.setUTCDate(endAt.getUTCDate() + duration);
  } else if (plan === "monthly") {
    endAt.setUTCMonth(endAt.getUTCMonth() + duration);
  } else {
    throw new Error("Invalid booking plan");
  }

  return { startAt, endAt };
};

const validateBookingInput = ({
  spaceName,
  bookingDate,
  plan,
  duration,
  selectedSpaces,
}) => {
  if (!spaceName?.trim()) {
    throw new Error("Workspace name is required");
  }

  if (!bookingDate) {
    throw new Error("Booking date is required");
  }

  if (!["hourly", "daily", "monthly"].includes(plan)) {
    throw new Error("Invalid booking plan");
  }

  if (
    !Number.isInteger(Number(duration)) ||
    Number(duration) < 1
  ) {
    throw new Error("Invalid booking duration");
  }

  if (
    !Array.isArray(selectedSpaces) ||
    selectedSpaces.length === 0
  ) {
    throw new Error("Select at least one workspace");
  }

  if (
    selectedSpaces.some(
      (code) => typeof code !== "string" || !code.trim()
    ) ||
    new Set(selectedSpaces).size !== selectedSpaces.length
  ) {
    throw new Error("Invalid or duplicate workspace codes");
  }
};

const getActiveSpaces = async (spaceName, selectedSpaces) => {
  const spaces = await Space.find({
    space: spaceName,
    spaceCode: { $in: selectedSpaces },
    status: "Active",
  });

  if (spaces.length !== selectedSpaces.length) {
    throw new Error(
      "One or more selected workspaces are invalid or inactive"
    );
  }

  return spaces;
};

const getServerPricing = (spaces, plan) => {
  const priceField = getPriceField(plan);

  if (!priceField) {
    throw new Error("Invalid booking plan");
  }

  const prices = spaces.map((space) => Number(space[priceField]));

  if (
    prices.some(
      (price) => !Number.isFinite(price) || price < 0
    ) ||
    prices.some((price) => price !== prices[0])
  ) {
    throw new Error(
      "Workspace pricing is invalid or inconsistent"
    );
  }

  return prices[0];
};

const getAvailability = async (
  selectedSpaces,
  startAt,
  endAt,
  excludeBookingId = null
) => {
  const pendingCutoff = new Date(Date.now() - 10 * 60 * 1000);

  const query = {
    selectedSpaces: { $in: selectedSpaces },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
    $or: [
      { status: "Confirmed" },
      {
        status: "Pending",
        paymentStatus: "Pending",
        createdAt: { $gte: pendingCutoff },
      },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await WorkspaceBooking.findOne(query)
    .select("bookingId selectedSpaces bookingDate");

  if (!conflictingBooking) {
    return {
      available: true,
      unavailableSpaces: [],
    };
  }

  const unavailableSpaces = selectedSpaces.filter((code) =>
    conflictingBooking.selectedSpaces.includes(code)
  );

  return {
    available: false,
    unavailableSpaces,
  };
};

// ==========================================
// CHECK WORKSPACE AVAILABILITY
// POST /api/booking/check_workspace_availability
// ==========================================

export const checkWorkspaceAvailability = async (req, res) => {
  try {
    const {
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
    } = req.body;

    validateBookingInput({
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
    });

    const { startAt, endAt } = getBookingRange(
      bookingDate,
      plan,
      Number(duration)
    );

    const spaces = await getActiveSpaces(
      spaceName.trim(),
      selectedSpaces
    );

    const availability = await getAvailability(
      selectedSpaces,
      startAt,
      endAt
    );

    return res.status(200).json({
      success: true,
      ...availability,
      availableCount: availability.available
        ? selectedSpaces.length
        : selectedSpaces.length -
          availability.unavailableSpaces.length,
      unavailableSpaces: availability.unavailableSpaces,
      bookingDate,
      plan,
      duration: Number(duration),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// CREATE RAZORPAY ORDER
// POST /api/booking/create_razorpay_order
// ==========================================

export const createRazorpayOrder = async (req, res) => {
  let booking = null;

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

    const {
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
    } = req.body;

    validateBookingInput({
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
    });

    const numericDuration = Number(duration);

    const { startAt, endAt } = getBookingRange(
      bookingDate,
      plan,
      numericDuration
    );

    const spaces = await getActiveSpaces(
      spaceName.trim(),
      selectedSpaces
    );

    const availability = await getAvailability(
      selectedSpaces,
      startAt,
      endAt
    );

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: "Some selected workspaces are unavailable",
        unavailableSpaces: availability.unavailableSpaces,
      });
    }

    // Never trust the total amount supplied by React.
    const pricePerUnit = getServerPricing(spaces, plan);
    const totalAmount =
      pricePerUnit * numericDuration * selectedSpaces.length;

    if (
      !Number.isSafeInteger(totalAmount) ||
      totalAmount <= 0 ||
      !Number.isSafeInteger(totalAmount * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount",
      });
    }

    const bookingId = `WSB-${new mongoose.Types.ObjectId()
      .toString()
      .toUpperCase()}`;

    // Create a pending booking before creating the payment order.
    booking = await WorkspaceBooking.create({
      bookingId,
      user: req.user.id,
      spaceName: spaceName.trim(),
      bookingDate,
      plan,
      duration: numericDuration,
      selectedSpaces,
      pricePerUnit,
      totalAmount,
      startAt,
      endAt,
      paymentStatus: "Pending",
      status: "Pending",
    });

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: bookingId,
      notes: {
        bookingId,
        userId: String(req.user.id),
      },
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      bookingId: booking.bookingId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      totalAmount,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    // Remove the temporary booking if order creation failed.
    if (booking && !booking.razorpayOrderId) {
      await WorkspaceBooking.deleteOne({ _id: booking._id }).catch(
        (cleanupError) =>
          console.error("Booking cleanup error:", cleanupError.message)
      );
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
};

// ==========================================
// ADD / CONFIRM WORKSPACE BOOKING
// POST /api/booking/add_workspace_booking
// ==========================================

export const addWorkspaceBooking = async (req, res) => {
  try {
    const {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (
      !bookingId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "All payment verification fields are required",
      });
    }

    const booking = await WorkspaceBooking.findOne({
      bookingId,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.status === "Confirmed" &&
      booking.paymentStatus === "Paid"
    ) {
      if (booking.razorpayPaymentId === razorpayPaymentId) {
        return res.status(200).json({
          success: true,
          message: "Booking already confirmed",
          booking,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Booking has already been paid",
      });
    }

    if (
      booking.status !== "Pending" ||
      booking.paymentStatus !== "Pending" ||
      booking.razorpayOrderId !== razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired booking order",
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
      payment.amount !== booking.totalAmount * 100 ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or amount does not match",
      });
    }

    // Recheck availability immediately before confirming.
    const availability = await getAvailability(
      booking.selectedSpaces,
      booking.startAt,
      booking.endAt,
      booking._id
    );

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message:
          "Payment succeeded, but a workspace conflict was detected. Contact support for a refund.",
        unavailableSpaces: availability.unavailableSpaces,
        paymentId: razorpayPaymentId,
      });
    }

    booking.razorpayPaymentId = razorpayPaymentId;
    booking.paymentStatus = "Paid";
    booking.status = "Confirmed";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Workspace booking confirmed successfully",
      booking,
    });
  } catch (error) {
    console.error("Add workspace booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm workspace booking",
    });
  }
};


// ==========================================
// GET MY RESERVATIONS
// GET /api/booking/my_reservations
// ==========================================

export const getMyReservations = async (req, res) => {
  try {
    // req.user.id is already used in your existing booking controllers.
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const reservations = await WorkspaceBooking.find({
      user: userId,
    })
      .select(
        "bookingId user spaceName bookingDate plan duration selectedSpaces pricePerUnit totalAmount startAt endAt paymentStatus status razorpayOrderId razorpayPaymentId createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Get my reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reservations",
    });
  }
};
