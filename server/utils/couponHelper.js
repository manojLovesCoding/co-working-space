import Coupon from "../models/couponModel.js";
import WorkspaceBooking from "../models/WorkspaceBooking.js";
import User from "../models/User.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Booking plan -> coupon packType
const PACK_TYPES = {
  hourly: "Per Hour",
  daily: "Per Day",
  monthly: "Per Month",
};

/**
 * Validates a coupon against a booking and calculates the discount.
 * Used by BOTH validate_coupon and create_razorpay_order.
 */
export const applyCoupon = async ({
  couponCode,
  spaceName,
  plan,
  subtotal,
  userId,
}) => {
  const code = String(couponCode || "")
    .trim()
    .toUpperCase();

  if (!code) {
    throw new Error("Coupon code is required");
  }

  const coupon = await Coupon.findOne({
    couponCode: code,
    status: "Active",
  });

  if (!coupon) {
    throw new Error("Invalid or inactive coupon code");
  }

  // Treat coupon dates as whole days in IST.
  const startsAt = coupon.validFrom.getTime() - IST_OFFSET_MS;
  const endsAt = coupon.validTo.getTime() - IST_OFFSET_MS + DAY_MS;
  const now = Date.now();

  if (now < startsAt) {
    throw new Error("This coupon is not active yet");
  }

  if (now >= endsAt) {
    throw new Error("This coupon has expired");
  }

  if (coupon.spaceType !== spaceName) {
    throw new Error(`This coupon is only valid for ${coupon.spaceType}`);
  }

  if (coupon.packType !== PACK_TYPES[plan]) {
    throw new Error(
      `This coupon is only valid for ${coupon.packType} bookings`,
    );
  }

  if (subtotal < coupon.minimumPrice || subtotal > coupon.maximumPrice) {
    throw new Error(
      `This coupon applies to bookings between ₹${coupon.minimumPrice} and ₹${coupon.maximumPrice}`,
    );
  }

  // Check whether the coupon is restricted to selected email addresses.
  if (coupon.userType === "Selected Email Addresses") {
    const user = await User.findById(userId).select("email");

    if (!user || !user.email) {
      throw new Error("Unable to verify your account email");
    }

    const customerEmail = user.email.trim().toLowerCase();

    const allowedEmails = (coupon.selectedEmails || []).map((email) =>
      String(email).trim().toLowerCase(),
    );

    if (!allowedEmails.includes(customerEmail)) {
      throw new Error("This coupon is not available for your email address");
    }
  }

  // Check first-time and existing-user eligibility.
  if (
    coupon.userType === "First Time Users" ||
    coupon.userType === "Existing Users"
  ) {
    const confirmedCount = await WorkspaceBooking.countDocuments({
      user: userId,
      status: "Confirmed",
    });

    if (coupon.userType === "First Time Users" && confirmedCount > 0) {
      throw new Error("This coupon is only for first-time users");
    }

    if (coupon.userType === "Existing Users" && confirmedCount === 0) {
      throw new Error("This coupon is only for existing users");
    }
  }

  // Whole rupees only, because the order amount must be a safe integer.
  const discountAmount = Math.round((subtotal * coupon.discount) / 100);

  const finalAmount = subtotal - discountAmount;

  if (finalAmount <= 0) {
    throw new Error("This coupon cannot be applied to this booking");
  }

  return {
    coupon,
    discountAmount,
    finalAmount,
  };
};
