import mongoose from "mongoose";

const virtualOfficePurchaseSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    virtualOfficePrice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VirtualOfficePrice",
      required: true,
    },

    planSnapshot: {
      planName: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: "",
      },
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    gstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
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

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    purchaseStatus: {
      type: String,
      enum: ["Pending", "Active", "Expired"],
      default: "Pending",
    },

    startDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

virtualOfficePurchaseSchema.index({ customer: 1, createdAt: -1 });
virtualOfficePurchaseSchema.index({ purchaseStatus: 1, expiryDate: 1 });

const VirtualOfficePurchase = mongoose.model(
  "VirtualOfficePurchase",
  virtualOfficePurchaseSchema,
);

export default VirtualOfficePurchase;
