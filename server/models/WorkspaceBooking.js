import mongoose from "mongoose";

const workspaceBookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    spaceName: {
      type: String,
      required: true,
      trim: true,
    },

    bookingDate: {
      type: String,
      required: true,
    },

    plan: {
      type: String,
      enum: ["hourly", "daily", "monthly"],
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    selectedSpaces: {
      type: [String],
      required: true,
      validate: {
        validator: (spaces) =>
          Array.isArray(spaces) && spaces.length > 0,
        message: "Select at least one workspace",
      },
    },

    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
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

workspaceBookingSchema.index({
  selectedSpaces: 1,
  startAt: 1,
  endAt: 1,
  status: 1,
});

export default mongoose.model(
  "WorkspaceBooking",
  workspaceBookingSchema
);