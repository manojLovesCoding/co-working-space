import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import Space from "../models/Space.js";
import User from "../models/User.js";
import TeamMember from "../models/TeamMember.js";
import WorkspaceBooking from "../models/WorkspaceBooking.js";
import { applyCoupon } from "../utils/couponHelper.js";
import {
  createInvoiceForBooking,
  resolveInvoiceDetails,
} from "../utils/invoiceHelper.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// OFFICE HOURS (India Standard Time, UTC+05:30)
// Mon-Fri: 08:00 - 19:00 | Sat: 09:00 - 19:00 | Sun: closed
// Values are minutes from midnight.
// ==========================================

const IST_OFFSET = "+05:30";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const OFFICE_HOURS = {
  weekday: { open: 8 * 60, close: 19 * 60 },
  saturday: { open: 9 * 60, close: 19 * 60 },
};

// Upper safety limits per plan
const MAX_DURATION = {
  hourly: 12,
  daily: 366,
  monthly: 36,
};

// ==========================================
// PER-HEAD SPACES
// Video Conferencing is one room booked for many attendees.
// Price = rate x duration x number of attendees (not seats).
// ==========================================

const PER_HEAD_SPACES = ["Video Conferencing"];
const MAX_HEADS_PER_ROOM = 20; // adjust to the real room capacity

const isPerHeadSpace = (spaceName) => PER_HEAD_SPACES.includes(spaceName);

// ==========================================
// GST
// GST is charged on the amount AFTER the coupon discount.
// totalAmount (what the customer pays) = taxableAmount + gstAmount.
// ==========================================

const GST_RATE = 18; // percent

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// taxable = amount after coupon, before GST
const withGst = (taxable) => {
  const taxableAmount = round2(taxable);
  const gstAmount = round2((taxableAmount * GST_RATE) / 100);

  return {
    taxableAmount,
    gstAmount,
    totalAmount: round2(taxableAmount + gstAmount),
  };
};

// Razorpay works in paise (integer)
const toPaise = (rupees) => Math.round(rupees * 100);

const getPriceField = (plan) => {
  const fields = {
    hourly: "perHour",
    daily: "perDay",
    monthly: "perMonth",
  };

  return fields[plan];
};

// ---------- date / time helpers ----------

const getTodayIST = () =>
  new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

// 0 = Sunday ... 6 = Saturday (calendar weekday of a YYYY-MM-DD string)
const getWeekday = (dateString) =>
  new Date(`${dateString}T00:00:00.000Z`).getUTCDay();

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// Clamps to the last day of the target month (Jan 31 + 1 month = Feb 28/29).
const addMonths = (dateString, months) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  const day = date.getUTCDate();

  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);

  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();

  date.setUTCDate(Math.min(day, lastDay));

  return date.toISOString().slice(0, 10);
};

const istMidnight = (dateString) =>
  new Date(`${dateString}T00:00:00.000${IST_OFFSET}`);

const isValidDateString = (dateString) =>
  typeof dateString === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
  new Date(`${dateString}T00:00:00.000Z`).toISOString().slice(0, 10) ===
    dateString;

const getOfficeHours = (dateString) => {
  const day = getWeekday(dateString);

  if (day === 0) return null;

  return day === 6 ? OFFICE_HOURS.saturday : OFFICE_HOURS.weekday;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
    totalMinutes % 60,
  ).padStart(2, "0")}`;

const formatMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

/**
 * Builds the reserved time range for a booking.
 *
 * - Sunday is always rejected.
 * - hourly:  startTime (HH:00) + duration hours, must fit in office hours.
 * - daily:   `duration` working days (Sundays are skipped).
 * - monthly: `duration` months from the booking date.
 */
const getBookingRange = (bookingDate, plan, duration, startTime) => {
  if (!isValidDateString(bookingDate)) {
    throw new Error("Invalid booking date");
  }

  if (bookingDate < getTodayIST()) {
    throw new Error("Booking date cannot be in the past");
  }

  const hours = getOfficeHours(bookingDate);

  if (!hours) {
    throw new Error(
      "The office is closed on Sundays. Please select another date.",
    );
  }

  if (plan === "hourly") {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration * 60;

    if (startMinutes < hours.open || endMinutes > hours.close) {
      throw new Error(
        `Hourly bookings must be within office hours (${formatMinutes(
          hours.open,
        )} - ${formatMinutes(hours.close)}) on the selected day`,
      );
    }

    const startAt = new Date(`${bookingDate}T${startTime}:00.000${IST_OFFSET}`);

    if (startAt.getTime() <= Date.now()) {
      throw new Error("Selected start time has already passed");
    }

    const endAt = new Date(startAt.getTime() + duration * 60 * 60 * 1000);

    return {
      startAt,
      endAt,
      startTime,
      endTime: minutesToTime(endMinutes),
    };
  }

  const startAt = istMidnight(bookingDate);

  if (plan === "daily") {
    // Count working days only (skip Sundays).
    let cursor = bookingDate;
    let counted = 0;

    while (counted < duration) {
      if (getWeekday(cursor) !== 0) counted += 1;
      cursor = addDays(cursor, 1);
    }

    return {
      startAt,
      endAt: istMidnight(cursor),
      startTime: null,
      endTime: null,
    };
  }

  if (plan === "monthly") {
    return {
      startAt,
      endAt: istMidnight(addMonths(bookingDate, duration)),
      startTime: null,
      endTime: null,
    };
  }

  throw new Error("Invalid booking plan");
};

const validateBookingInput = ({
  spaceName,
  bookingDate,
  plan,
  duration,
  selectedSpaces,
  startTime,
}) => {
  if (typeof spaceName !== "string" || !spaceName.trim()) {
    throw new Error("Workspace name is required");
  }

  if (!bookingDate) {
    throw new Error("Booking date is required");
  }

  if (!["hourly", "daily", "monthly"].includes(plan)) {
    throw new Error("Invalid booking plan");
  }

  const numericDuration = Number(duration);

  if (
    !Number.isInteger(numericDuration) ||
    numericDuration < 1 ||
    numericDuration > MAX_DURATION[plan]
  ) {
    throw new Error("Invalid booking duration");
  }

  if (plan === "hourly") {
    if (!startTime) {
      throw new Error("Start time is required for hourly bookings");
    }

    // Whole-hour slots only, e.g. "08:00", "14:00"
    if (
      typeof startTime !== "string" ||
      !/^([01]\d|2[0-3]):00$/.test(startTime)
    ) {
      throw new Error("Invalid start time");
    }
  }

  if (!Array.isArray(selectedSpaces) || selectedSpaces.length === 0) {
    throw new Error("Select at least one workspace");
  }

  if (
    selectedSpaces.some((code) => typeof code !== "string" || !code.trim()) ||
    new Set(selectedSpaces).size !== selectedSpaces.length
  ) {
    throw new Error("Invalid or duplicate workspace codes");
  }
};

/**
 * Every selected seat must be assigned to the logged-in customer
 * ("self") or to one of their active team members ("team").
 * Each person can hold only one seat per booking.
 *
 * Returns a snapshot of each assignee to store on the booking.
 */
const resolveSeatAssignments = async (
  userId,
  selectedSpaces,
  seatAssignments,
) => {
  if (
    !Array.isArray(seatAssignments) ||
    seatAssignments.length !== selectedSpaces.length
  ) {
    throw new Error("Assign every selected seat to yourself or a team member");
  }

  const validCodes = new Set(selectedSpaces);
  const seenCodes = new Set();
  const memberIds = [];
  let selfCount = 0;

  for (const item of seatAssignments) {
    if (
      !item ||
      !validCodes.has(item.spaceCode) ||
      seenCodes.has(item.spaceCode)
    ) {
      throw new Error("Invalid seat assignment");
    }

    seenCodes.add(item.spaceCode);

    if (item.assigneeType === "self") {
      selfCount += 1;
    } else if (item.assigneeType === "team") {
      if (!mongoose.Types.ObjectId.isValid(item.teamMemberId)) {
        throw new Error("Invalid team member");
      }

      memberIds.push(String(item.teamMemberId));
    } else {
      throw new Error("Invalid seat assignment");
    }
  }

  if (selfCount > 1 || new Set(memberIds).size !== memberIds.length) {
    throw new Error("One person cannot be assigned to more than one seat");
  }

  const [customer, members] = await Promise.all([
    User.findOne({ _id: userId, role: "customer", isActive: true }),
    TeamMember.find({
      _id: { $in: memberIds },
      customer: userId,
      isActive: true,
    }),
  ]);

  if (!customer) {
    throw new Error("Customer account not found");
  }

  if (members.length !== memberIds.length) {
    throw new Error("One or more team members are invalid or inactive");
  }

  const memberMap = new Map(members.map((m) => [String(m._id), m]));

  return seatAssignments.map((item) => {
    if (item.assigneeType === "self") {
      return {
        spaceCode: item.spaceCode,
        assigneeType: "self",
        teamMember: null,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      };
    }

    const member = memberMap.get(String(item.teamMemberId));

    return {
      spaceCode: item.spaceCode,
      assigneeType: "team",
      teamMember: member._id,
      name: member.name,
      email: member.email,
      phone: member.phone,
    };
  });
};

/**
 * Per-head spaces (Video Conferencing): ONE room, MANY attendees.
 * Each attendee is the logged-in customer ("self") or one of their
 * active team members ("team"). A person can be added only once.
 *
 * Entries look like { assigneeType: "self" | "team", teamMemberId? }.
 * Returns a snapshot of each attendee, all pointing at the room's code.
 */
const resolveAttendees = async (userId, selectedSpaces, attendees) => {
  if (selectedSpaces.length !== 1) {
    throw new Error("Select one conference room");
  }

  if (
    !Array.isArray(attendees) ||
    attendees.length < 1 ||
    attendees.length > MAX_HEADS_PER_ROOM
  ) {
    throw new Error(`Select between 1 and ${MAX_HEADS_PER_ROOM} attendees`);
  }

  let selfCount = 0;
  const memberIds = [];

  for (const item of attendees) {
    if (item?.assigneeType === "self") {
      selfCount += 1;
    } else if (
      item?.assigneeType === "team" &&
      mongoose.Types.ObjectId.isValid(item.teamMemberId)
    ) {
      memberIds.push(String(item.teamMemberId));
    } else {
      throw new Error("Invalid attendee");
    }
  }

  if (selfCount > 1 || new Set(memberIds).size !== memberIds.length) {
    throw new Error("An attendee cannot be added twice");
  }

  const [customer, members] = await Promise.all([
    User.findOne({ _id: userId, role: "customer", isActive: true }),
    TeamMember.find({
      _id: { $in: memberIds },
      customer: userId,
      isActive: true,
    }),
  ]);

  if (!customer) {
    throw new Error("Customer account not found");
  }

  if (members.length !== memberIds.length) {
    throw new Error("One or more team members are invalid or inactive");
  }

  const memberMap = new Map(members.map((m) => [String(m._id), m]));

  return attendees.map((item) => {
    if (item.assigneeType === "self") {
      return {
        spaceCode: selectedSpaces[0],
        assigneeType: "self",
        teamMember: null,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      };
    }

    const member = memberMap.get(String(item.teamMemberId));

    return {
      spaceCode: selectedSpaces[0],
      assigneeType: "team",
      teamMember: member._id,
      name: member.name,
      email: member.email,
      phone: member.phone,
    };
  });
};

// Picks the right resolver: attendees for per-head rooms, seats otherwise.
const resolveParticipants = (userId, spaceName, selectedSpaces, list) =>
  isPerHeadSpace(spaceName)
    ? resolveAttendees(userId, selectedSpaces, list)
    : resolveSeatAssignments(userId, selectedSpaces, list);

// Billable units: attendees for per-head rooms, seats otherwise.
const getBillableQuantity = (spaceName, selectedSpaces, participants) =>
  isPerHeadSpace(spaceName) ? participants.length : selectedSpaces.length;

const getActiveSpaces = async (spaceName, selectedSpaces) => {
  const spaces = await Space.find({
    space: spaceName,
    spaceCode: { $in: selectedSpaces },
    status: "Active",
  });

  if (spaces.length !== selectedSpaces.length) {
    throw new Error("One or more selected workspaces are invalid or inactive");
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
    prices.some((price) => !Number.isFinite(price) || price < 0) ||
    prices.some((price) => price !== prices[0])
  ) {
    throw new Error("Workspace pricing is invalid or inconsistent");
  }

  return prices[0];
};

/**
 * Options:
 * - excludeBookingId: ignore this booking (the one being checked)
 * - confirmedOnly:    only Confirmed bookings block (used at payment time,
 *                     so the first person to PAY wins, not the first to start)
 * - pendingBeforeId:  only Pending bookings created before this booking
 *                     block (used right after creating a pending booking,
 *                     so two simultaneous users cannot both keep the seat)
 */
const getAvailability = async (
  selectedSpaces,
  startAt,
  endAt,
  options = {},
) => {
  const {
    excludeBookingId = null,
    confirmedOnly = false,
    pendingBeforeId = null,
  } = options;

  const pendingCutoff = new Date(Date.now() - 10 * 60 * 1000);

  const blocking = [{ status: "Confirmed" }];

  if (!confirmedOnly) {
    const pending = {
      status: "Pending",
      paymentStatus: "Pending",
      createdAt: { $gte: pendingCutoff },
    };

    if (pendingBeforeId) {
      pending._id = { $lt: pendingBeforeId };
    }

    blocking.push(pending);
  }

  const query = {
    selectedSpaces: { $in: selectedSpaces },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
    $or: blocking,
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  // Check ALL overlapping bookings, not just the first one found.
  const conflictingBookings =
    await WorkspaceBooking.find(query).select("selectedSpaces");

  const takenCodes = new Set(
    conflictingBookings.flatMap((booking) => booking.selectedSpaces),
  );

  const unavailableSpaces = selectedSpaces.filter((code) =>
    takenCodes.has(code),
  );

  return {
    available: unavailableSpaces.length === 0,
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
      startTime,
    } = req.body;

    validateBookingInput({
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
      startTime,
    });

    const { startAt, endAt, endTime } = getBookingRange(
      bookingDate,
      plan,
      Number(duration),
      startTime,
    );

    await getActiveSpaces(spaceName.trim(), selectedSpaces);

    const availability = await getAvailability(selectedSpaces, startAt, endAt);

    return res.status(200).json({
      success: true,
      ...availability,
      availableCount: availability.available
        ? selectedSpaces.length
        : selectedSpaces.length - availability.unavailableSpaces.length,
      unavailableSpaces: availability.unavailableSpaces,
      bookingDate,
      plan,
      duration: Number(duration),
      startTime: plan === "hourly" ? startTime : null,
      endTime,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// VALIDATE COUPON
// POST /api/booking/validate_coupon
//
// Previews the discount for the booking page.
// The real discount is applied again (server side)
// inside createRazorpayOrder.
//
// finalAmount = after coupon, BEFORE GST.
// gstAmount / totalAmount include the 18% GST.
// ==========================================

export const validateCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
      startTime,
      seatAssignments,
    } = req.body;

    validateBookingInput({
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
      startTime,
    });

    // Throws for Sundays, past dates or invalid hourly slots.
    getBookingRange(bookingDate, plan, Number(duration), startTime);

    const spaces = await getActiveSpaces(spaceName.trim(), selectedSpaces);

    const pricePerUnit = getServerPricing(spaces, plan);

    // Seats for normal spaces, attendees for per-head rooms.
    let quantity = selectedSpaces.length;

    if (isPerHeadSpace(spaceName.trim())) {
      const attendees = await resolveAttendees(
        req.user.id,
        selectedSpaces,
        seatAssignments,
      );

      quantity = attendees.length;
    }

    const subtotal = pricePerUnit * Number(duration) * quantity;

    const { coupon, discountAmount, finalAmount } = await applyCoupon({
      couponCode,
      spaceName: spaceName.trim(),
      plan,
      subtotal,
      userId: req.user.id,
    });

    const gst = withGst(finalAmount);

    return res.status(200).json({
      success: true,
      couponCode: coupon.couponCode,
      discountPercent: coupon.discount,
      subtotal,
      discountAmount,
      finalAmount, // after coupon, before GST
      gstRate: GST_RATE,
      gstAmount: gst.gstAmount,
      totalAmount: gst.totalAmount,
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
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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
      seatAssignments,
      invoiceType,
      billingDetails,
      startTime,
      couponCode,
    } = req.body;

    validateBookingInput({
      spaceName,
      bookingDate,
      plan,
      duration,
      selectedSpaces,
      startTime,
    });

    // Seats (normal spaces) or attendees (per-head rooms) must belong to
    // the customer or one of their team members.
    const resolvedAssignments = await resolveParticipants(
      req.user.id,
      spaceName.trim(),
      selectedSpaces,
      seatAssignments,
    );

    // Billable units: attendees for per-head rooms, seats otherwise.
    const quantity = getBillableQuantity(
      spaceName.trim(),
      selectedSpaces,
      resolvedAssignments,
    );

    // One invoice type per booking: customer OR business, never both.
    const invoiceInfo = resolveInvoiceDetails(invoiceType, billingDetails);

    const numericDuration = Number(duration);

    // Sunday / office-hours rules are enforced here, so payment can
    // never be started for a closed day or time.
    const {
      startAt,
      endAt,
      startTime: bookingStartTime,
      endTime,
    } = getBookingRange(bookingDate, plan, numericDuration, startTime);

    const spaces = await getActiveSpaces(spaceName.trim(), selectedSpaces);

    const availability = await getAvailability(selectedSpaces, startAt, endAt);

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: "Some selected workspaces are unavailable",
        unavailableSpaces: availability.unavailableSpaces,
      });
    }

    // Never trust the total amount supplied by React.
    const pricePerUnit = getServerPricing(spaces, plan);
    const subtotal = pricePerUnit * numericDuration * quantity;

    // Apply the coupon on the server (if one was sent).
    let taxable = subtotal;
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const result = await applyCoupon({
        couponCode,
        spaceName: spaceName.trim(),
        plan,
        subtotal,
        userId: req.user.id,
      });

      discountAmount = result.discountAmount;
      taxable = result.finalAmount;
      appliedCouponCode = result.coupon.couponCode;
    }

    // GST (18%) is added on the amount after the coupon discount.
    const { taxableAmount, gstAmount, totalAmount } = withGst(taxable);
    const amountInPaise = toPaise(totalAmount);

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      !Number.isSafeInteger(amountInPaise)
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
      headCount: quantity,
      seatAssignments: resolvedAssignments,
      invoiceType: invoiceInfo.invoiceType,
      billingDetails: invoiceInfo.billingDetails,
      pricePerUnit,
      subtotal,
      discountAmount,
      couponCode: appliedCouponCode,
      taxableAmount,
      gstRate: GST_RATE,
      gstAmount,
      totalAmount, // final amount charged, including GST
      startTime: bookingStartTime, // "HH:mm" for hourly, null otherwise
      endTime, // "HH:mm" for hourly, null otherwise
      startAt,
      endAt,
      paymentStatus: "Pending",
      status: "Pending",
    });

    // Race-condition guard: two users can pass the first availability check
    // at the same moment. Re-check now, counting only Confirmed bookings and
    // Pending bookings created BEFORE this one. The later request backs off.
    const raceCheck = await getAvailability(selectedSpaces, startAt, endAt, {
      excludeBookingId: booking._id,
      pendingBeforeId: booking._id,
    });

    if (!raceCheck.available) {
      await WorkspaceBooking.deleteOne({ _id: booking._id });
      booking = null;

      return res.status(409).json({
        success: false,
        message: "Some selected workspaces are unavailable",
        unavailableSpaces: raceCheck.unavailableSpaces,
      });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: bookingId,
      notes: {
        bookingId,
        userId: String(req.user.id),
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
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
      headCount: quantity,
      subtotal,
      discountAmount,
      couponCode: appliedCouponCode,
      taxableAmount,
      gstRate: GST_RATE,
      gstAmount,
      totalAmount,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    // Remove the temporary booking if order creation failed.
    if (booking && !booking.razorpayOrderId) {
      await WorkspaceBooking.deleteOne({ _id: booking._id }).catch(
        (cleanupError) =>
          console.error("Booking cleanup error:", cleanupError.message),
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
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;

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

    if (booking.status === "Confirmed" && booking.paymentStatus === "Paid") {
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
    // booking.totalAmount is the discounted amount including GST.
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (
      payment.order_id !== razorpayOrderId ||
      payment.status !== "captured" ||
      payment.amount !== toPaise(booking.totalAmount) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or amount does not match",
      });
    }

    // Recheck availability immediately before confirming.
    // Only CONFIRMED bookings block here, so the first person to pay wins
    // and is never rejected because someone else merely started checkout.
    const availability = await getAvailability(
      booking.selectedSpaces,
      booking.startAt,
      booking.endAt,
      {
        excludeBookingId: booking._id,
        confirmedOnly: true,
      },
    );

    if (!availability.available) {
      // The seat was confirmed by someone else. Refund automatically.
      let refunded = false;

      try {
        await razorpay.payments.refund(razorpayPaymentId, {
          speed: "normal",
          notes: { bookingId: booking.bookingId, reason: "Seat conflict" },
        });
        refunded = true;
      } catch (refundError) {
        console.error(
          "Automatic refund failed:",
          refundError?.error?.description || refundError.message,
        );
      }

      booking.razorpayPaymentId = razorpayPaymentId;
      booking.paymentStatus = refunded ? "Refunded" : "Paid";
      booking.status = "Cancelled";
      await booking.save();

      return res.status(409).json({
        success: false,
        message: refunded
          ? "Sorry, these workspaces were just booked by someone else. Your payment has been refunded and will reach you in 5-7 working days."
          : "Sorry, these workspaces were just booked by someone else. Your refund could not be started automatically. Please contact support with your payment ID.",
        unavailableSpaces: availability.unavailableSpaces,
        paymentId: razorpayPaymentId,
        refunded,
      });
    }

    booking.razorpayPaymentId = razorpayPaymentId;
    booking.paymentStatus = "Paid";
    booking.status = "Confirmed";

    await booking.save();

    // Generate the invoice (customer OR business, as chosen at checkout).
    // A failure here must never undo a confirmed, paid booking: the
    // invoice is created on demand the first time it is opened.
    let invoice = null;

    try {
      invoice = await createInvoiceForBooking(booking);
    } catch (invoiceError) {
      console.error("Invoice generation error:", invoiceError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Workspace booking confirmed successfully",
      booking,
      invoiceNumber: invoice?.invoiceNumber || null,
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
        "bookingId user spaceName bookingDate plan duration selectedSpaces headCount seatAssignments pricePerUnit subtotal discountAmount couponCode taxableAmount gstRate gstAmount totalAmount startTime endTime startAt endAt paymentStatus status razorpayOrderId razorpayPaymentId createdAt",
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

// ==========================================
// GET ALL RESERVATIONS (ADMIN)
// GET /api/booking/all_reservations
// ==========================================

export const getAllReservations = async (req, res) => {
  try {
    const reservations = await WorkspaceBooking.find()
      .populate("user", "name email phone")
      .select(
        "bookingId user spaceName bookingDate plan duration selectedSpaces headCount seatAssignments pricePerUnit subtotal discountAmount couponCode taxableAmount gstRate gstAmount totalAmount startTime endTime startAt endAt paymentStatus status razorpayOrderId razorpayPaymentId createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Get all reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reservations",
    });
  }
};

// ==========================================
// SEAT STATUS (which seats are already booked)
// POST /api/booking/seat_status
//
// Uses the same blocking rules as getAvailability: Confirmed bookings
// and Pending bookings younger than 10 minutes.
//
// Response: { seats: { [spaceCode]: { fullDay, bookedSlots } } }
//  - hourly request: hourly bookings -> bookedSlots, daily/monthly -> fullDay
//  - daily/monthly request: any overlapping booking -> fullDay
// ==========================================

export const getSeatStatus = async (req, res) => {
  try {
    const { spaceName, bookingDate, plan, duration } = req.body;

    if (typeof spaceName !== "string" || !spaceName.trim()) {
      throw new Error("Workspace name is required");
    }

    if (!["hourly", "daily", "monthly"].includes(plan)) {
      throw new Error("Invalid booking plan");
    }

    if (!isValidDateString(bookingDate)) {
      throw new Error("Invalid booking date");
    }

    const numericDuration = Number(duration);

    if (
      !Number.isInteger(numericDuration) ||
      numericDuration < 1 ||
      numericDuration > MAX_DURATION[plan]
    ) {
      throw new Error("Invalid booking duration");
    }

    // Nothing to show for past dates or Sundays.
    if (bookingDate < getTodayIST() || !getOfficeHours(bookingDate)) {
      return res.status(200).json({ success: true, seats: {} });
    }

    let startAt;
    let endAt;

    if (plan === "hourly") {
      // The whole selected day; the page checks the chosen time itself.
      startAt = istMidnight(bookingDate);
      endAt = istMidnight(addDays(bookingDate, 1));
    } else {
      ({ startAt, endAt } = getBookingRange(
        bookingDate,
        plan,
        numericDuration,
      ));
    }

    const pendingCutoff = new Date(Date.now() - 10 * 60 * 1000);

    const bookings = await WorkspaceBooking.find({
      spaceName: spaceName.trim(),
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
    })
      .select("plan selectedSpaces startTime endTime")
      .lean();

    const seats = {};

    for (const booking of bookings) {
      for (const code of booking.selectedSpaces) {
        if (!seats[code]) seats[code] = { fullDay: false, bookedSlots: [] };

        if (plan === "hourly" && booking.plan === "hourly") {
          seats[code].bookedSlots.push({
            startTime: booking.startTime,
            endTime: booking.endTime,
          });
        } else {
          seats[code].fullDay = true;
        }
      }
    }

    return res.status(200).json({ success: true, seats });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
