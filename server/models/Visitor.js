import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      unique: true,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The workspace booking this visitor pass belongs to
    bookingId: {
      type: String,
      required: true,
    },

    spaceName: {
      type: String,
      required: true,
      trim: true,
    },

    selectedSpaces: {
      type: [String],
      default: [],
    },

    bookingStartAt: {
      type: Date,
      required: true,
    },

    bookingEndAt: {
      type: Date,
      required: true,
    },

    // Visitor details
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    contact: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Invalid contact number"],
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    attendees: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      validate: {
        validator: Number.isInteger,
        message: "Attendees must be a whole number",
      },
    },

    // Pricing (rupees). Always calculated on the server.
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    visitHours: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    gstAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Amount sent to Razorpay, in paise
    totalPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    // No default on purpose: the sparse unique index ignores
    // documents where this field is missing.
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

visitorSchema.index({ user: 1, createdAt: -1 });
visitorSchema.index({ bookingId: 1, status: 1 });

// Automatically delete abandoned visitor passes that were never paid.
visitorSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 24 * 60 * 60,
    partialFilterExpression: {
      status: "Pending",
      paymentStatus: "Pending",
    },
  }
);

export default mongoose.model("Visitor", visitorSchema);