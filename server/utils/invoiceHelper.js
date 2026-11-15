import Counter from "../models/Counter.js";
import Invoice from "../models/Invoice.js";
import User from "../models/User.js";

// ==========================================
// Seller details and GST settings.
// Set these in your .env file:
//   COMPANY_NAME, COMPANY_ADDRESS, COMPANY_GSTIN, COMPANY_STATE_CODE,
//   COMPANY_EMAIL, COMPANY_PHONE, INVOICE_SAC_CODE, GST_RATE
// ==========================================

const getSeller = () => {
  const gstin = (process.env.COMPANY_GSTIN || "").trim().toUpperCase();
  const stateCode = (
    process.env.COMPANY_STATE_CODE ||
    gstin.slice(0, 2) ||
    ""
  ).trim();

  return {
    name: process.env.COMPANY_NAME || "Your Company Name",
    address: process.env.COMPANY_ADDRESS || "",
    gstin,
    stateCode,
    state: STATE_NAMES[stateCode] || "",
    email: process.env.COMPANY_EMAIL || "",
    phone: process.env.COMPANY_PHONE || "",
    sacCode: process.env.INVOICE_SAC_CODE || "997212",
  };
};

const getGstRate = () => {
  const rate = Number(process.env.GST_RATE ?? 18);
  return Number.isFinite(rate) && rate >= 0 ? rate : 18;
};

const STATE_NAMES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  10: "Bihar",
  11: "Sikkim",
  12: "Arunachal Pradesh",
  13: "Nagaland",
  14: "Manipur",
  15: "Mizoram",
  16: "Tripura",
  17: "Meghalaya",
  18: "Assam",
  19: "West Bengal",
  20: "Jharkhand",
  21: "Odisha",
  22: "Chhattisgarh",
  23: "Madhya Pradesh",
  24: "Gujarat",
  26: "Dadra and Nagar Haveli and Daman and Diu",
  27: "Maharashtra",
  29: "Karnataka",
  30: "Goa",
  31: "Lakshadweep",
  32: "Kerala",
  33: "Tamil Nadu",
  34: "Puducherry",
  35: "Andaman and Nicobar Islands",
  36: "Telangana",
  37: "Andhra Pradesh",
  38: "Ladakh",
  97: "Other Territory",
};

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// ==========================================
// Validates the invoice choice made at checkout.
// A booking gets exactly ONE invoice type.
// ==========================================

export const resolveInvoiceDetails = (invoiceType, billingDetails) => {
  const type = invoiceType || "customer";

  if (!["customer", "business"].includes(type)) {
    throw new Error("Invalid invoice type");
  }

  if (type === "customer") {
    return {
      invoiceType: "customer",
      billingDetails: {
        businessName: "",
        gstin: "",
        address: "",
        state: "",
        stateCode: "",
      },
    };
  }

  const businessName = String(billingDetails?.businessName || "").trim();
  const gstin = String(billingDetails?.gstin || "")
    .trim()
    .toUpperCase();
  const address = String(billingDetails?.address || "").trim();

  if (!businessName) {
    throw new Error("Business name is required for a business invoice");
  }

  if (!GSTIN_REGEX.test(gstin)) {
    throw new Error("Enter a valid 15-character GSTIN");
  }

  const stateCode = gstin.slice(0, 2);

  if (!STATE_NAMES[stateCode]) {
    throw new Error("GSTIN has an invalid state code");
  }

  if (address.length < 10) {
    throw new Error("Billing address is required for a business invoice");
  }

  return {
    invoiceType: "business",
    billingDetails: {
      businessName: businessName.slice(0, 150),
      gstin,
      address: address.slice(0, 300),
      state: STATE_NAMES[stateCode],
      stateCode,
    },
  };
};

// ==========================================
// Sequential invoice number per financial year (Apr - Mar, IST).
// Example: INV-2627-000001
// ==========================================

const getFinancialYearKey = (date) => {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth() + 1; // 1-12

  const startYear = month >= 4 ? year : year - 1;

  return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
};

const nextInvoiceNumber = async (date) => {
  const key = getFinancialYearKey(date);

  const counter = await Counter.findOneAndUpdate(
    { _id: `invoice-${key}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `INV-${key}-${String(counter.seq).padStart(6, "0")}`;
};

const unitName = (plan) =>
  plan === "hourly" ? "hour" : plan === "monthly" ? "month" : "day";

// ==========================================
// Creates the invoice for a confirmed, paid booking.
// Safe to call many times: it returns the existing invoice if there is one.
// ==========================================

export const createInvoiceForBooking = async (booking) => {
  if (booking.status !== "Confirmed" || booking.paymentStatus !== "Paid") {
    throw new Error(
      "An invoice can only be generated for a confirmed, paid booking",
    );
  }

  const existing = await Invoice.findOne({ booking: booking._id });

  if (existing) return existing;

  const user = await User.findById(booking.user);

  if (!user) {
    throw new Error("Customer account not found");
  }

  const seller = getSeller();
  const gstRate = getGstRate();
  const isBusiness = booking.invoiceType === "business";
  const billing = booking.billingDetails || {};

  const buyer = isBusiness
    ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: billing.businessName || "",
        gstin: billing.gstin || "",
        address: billing.address || "",
        state: billing.state || "",
        stateCode: billing.stateCode || "",
      }
    : {
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: "",
        gstin: "",
        address: user.address || "",
        state: "",
        stateCode: "",
      };

  // Tax: the amount paid is GST-inclusive, so back the tax out of it.
  const totalAmount = Number(booking.totalAmount);
  const taxableValue = round2(totalAmount / (1 + gstRate / 100));
  const totalTax = round2(totalAmount - taxableValue);

  const isInterState =
    isBusiness &&
    buyer.stateCode &&
    seller.stateCode &&
    buyer.stateCode !== seller.stateCode;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = totalTax;
  } else {
    cgst = round2(totalTax / 2);
    sgst = round2(totalTax - cgst);
  }

  const seatCount = booking.selectedSpaces.length;
  const quantity = booking.duration * seatCount;
  const unit = unitName(booking.plan);

  const issuedAt = new Date();
  const invoiceNumber = await nextInvoiceNumber(issuedAt);

  const seatAssignments = Array.isArray(booking.seatAssignments)
    ? booking.seatAssignments
    : [];

  try {
    return await Invoice.create({
      invoiceNumber,
      booking: booking._id,
      bookingId: booking.bookingId,
      user: booking.user,
      invoiceType: isBusiness ? "business" : "customer",
      issuedAt,
      seller,
      buyer,
      items: [
        {
          description: `${booking.spaceName} - ${booking.plan} workspace booking (${seatCount} seat${
            seatCount > 1 ? "s" : ""
          })`,
          sacCode: seller.sacCode,
          quantity,
          unit,
          rate: booking.pricePerUnit,
          amount: booking.subtotal ?? quantity * booking.pricePerUnit,
        },
      ],
      seats: seatAssignments.length
        ? seatAssignments.map((seat) => ({
            spaceCode: seat.spaceCode,
            name: seat.name,
          }))
        : booking.selectedSpaces.map((code) => ({ spaceCode: code })),
      period: {
        plan: booking.plan,
        duration: booking.duration,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        startAt: booking.startAt,
        endAt: booking.endAt,
      },
      subtotal: booking.subtotal ?? totalAmount + (booking.discountAmount || 0),
      discountAmount: booking.discountAmount || 0,
      couponCode: booking.couponCode || null,
      totalAmount,
      gstRate,
      taxType: isInterState ? "IGST" : "CGST_SGST",
      taxableValue,
      cgst,
      sgst,
      igst,
      razorpayOrderId: booking.razorpayOrderId || "",
      razorpayPaymentId: booking.razorpayPaymentId || "",
    });
  } catch (error) {
    // Two requests raced: the other one created the invoice first.
    if (error?.code === 11000) {
      const created = await Invoice.findOne({ booking: booking._id });
      if (created) return created;
    }

    throw error;
  }
};
