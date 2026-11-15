import mongoose from "mongoose";

const partySchema = {
  name: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true },
  phone: { type: String, default: "", trim: true },
  address: { type: String, default: "", trim: true },
  gstin: { type: String, default: "", trim: true },
  state: { type: String, default: "", trim: true },
  stateCode: { type: String, default: "", trim: true },
};

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // One invoice per booking. The unique index guarantees a customer
    // can never end up with both a customer and a business invoice.
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkspaceBooking",
      required: true,
      unique: true,
    },

    bookingId: { type: String, required: true },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invoiceType: {
      type: String,
      enum: ["customer", "business"],
      required: true,
    },

    issuedAt: { type: Date, required: true },

    // Snapshots, so old invoices never change when profiles change.
    seller: {
      ...partySchema,
      sacCode: { type: String, default: "", trim: true },
    },

    buyer: {
      ...partySchema,
      businessName: { type: String, default: "", trim: true },
    },

    items: [
      {
        _id: false,
        description: { type: String, required: true },
        sacCode: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: "" },
        rate: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],

    seats: [
      {
        _id: false,
        spaceCode: { type: String, required: true },
        name: { type: String, default: "" },
      },
    ],

    period: {
      plan: { type: String, default: "" },
      duration: { type: Number, default: 0 },
      bookingDate: { type: String, default: "" },
      startTime: { type: String, default: null },
      endTime: { type: String, default: null },
      startAt: { type: Date, default: null },
      endAt: { type: Date, default: null },
    },

    // Amounts (INR). totalAmount is exactly what the customer paid and is
    // treated as GST-inclusive.
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null },
    totalAmount: { type: Number, required: true, min: 0 },

    gstRate: { type: Number, default: 0, min: 0 },
    taxType: {
      type: String,
      enum: ["CGST_SGST", "IGST"],
      default: "CGST_SGST",
    },
    taxableValue: { type: Number, default: 0, min: 0 },
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 },

    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
  },
  { timestamps: true },
);

invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ createdAt: -1 });

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);
