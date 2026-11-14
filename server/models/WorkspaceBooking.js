import mongoose from "mongoose";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

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
        validator: (spaces) => Array.isArray(spaces) && spaces.length > 0,
        message: "Select at least one workspace",
      },
    },

    // Who each seat is booked for (snapshot, so history survives edits
    // or deactivation of team members)
    seatAssignments: {
      type: [
        {
          _id: false,
          spaceCode: { type: String, required: true },
          assigneeType: {
            type: String,
            enum: ["self", "team"],
            required: true,
          },
          teamMember: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TeamMember",
            default: null,
          },
          name: { type: String, required: true, trim: true },
          email: { type: String, default: "", trim: true },
          phone: { type: String, default: "", trim: true },
        },
      ],
      default: [],
    },

    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },

    // Price before any coupon discount
    subtotal: {
      type: Number,
      default: null,
      min: 0,
    },

    // Coupon discount in rupees (0 when no coupon is used)
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Stored as plain text so history survives if the coupon is deleted
    couponCode: {
      type: String,
      default: null,
    },

    // Final amount charged (subtotal - discountAmount)
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Only used for hourly bookings: "HH:mm" in IST (e.g. "14:00").
    // Stays null for daily and monthly bookings.
    startTime: {
      type: String,
      default: null,
      match: [TIME_REGEX, "Invalid start time"],
    },

    endTime: {
      type: String,
      default: null,
      match: [TIME_REGEX, "Invalid end time"],
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startAt || value > this.startAt;
        },
        message: "endAt must be after startAt",
      },
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    // No default on purpose: the sparse unique index below ignores
    // documents where this field is missing, so unpaid bookings
    // do not clash with each other.
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
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
  },
);

// Availability query
workspaceBookingSchema.index({
  selectedSpaces: 1,
  startAt: 1,
  endAt: 1,
  status: 1,
});

// Automatically delete abandoned bookings that were never paid.
// Confirmed bookings no longer match the filter, so they are never removed.
workspaceBookingSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 24 * 60 * 60,
    partialFilterExpression: {
      status: "Pending",
      paymentStatus: "Pending",
    },
  },
);

export default mongoose.model("WorkspaceBooking", workspaceBookingSchema);
