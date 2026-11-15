import mongoose from "mongoose";

import Invoice from "../models/Invoice.js";
import WorkspaceBooking from "../models/WorkspaceBooking.js";
import { createInvoiceForBooking } from "../utils/invoiceHelper.js";

const LIST_FIELDS =
  "invoiceNumber bookingId invoiceType issuedAt buyer.name buyer.businessName buyer.gstin totalAmount gstRate taxType createdAt";

// ==========================================
// GET MY INVOICES
// GET /api/invoice/my
// ==========================================

export const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .select(LIST_FIELDS)
      .sort({ issuedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Get my invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
};

// ==========================================
// GET MY INVOICE FOR A BOOKING
// GET /api/invoice/booking/:bookingId
//
// Generates the invoice on first request if the booking is
// confirmed and paid but has no invoice yet (for example,
// bookings confirmed before invoicing was added).
// ==========================================

export const getMyInvoiceByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

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

    if (booking.status !== "Confirmed" || booking.paymentStatus !== "Paid") {
      return res.status(400).json({
        success: false,
        message: "An invoice is available only after the payment is confirmed.",
      });
    }

    const invoice = await createInvoiceForBooking(booking);

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get invoice by booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load invoice",
    });
  }
};

// ==========================================
// GET ALL INVOICES (ADMIN)
// GET /api/invoice/all
// ==========================================

export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("user", "name email phone")
      .select(`${LIST_FIELDS} user buyer.email buyer.phone`)
      .sort({ issuedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Get all invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
};

// ==========================================
// GET ONE INVOICE (ADMIN)
// GET /api/invoice/admin/:id
// ==========================================

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findById(id).lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load invoice",
    });
  }
};
