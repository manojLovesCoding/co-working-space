import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validTo: {
      type: Date,
      required: true,
    },

    userType: {
      type: String,
      required: true,
      enum: ["All Users", "First Time Users", "Existing Users"],
    },

    spaceType: {
      type: String,
      required: true,
      enum: [
        "Workspace",
        "Team Leads Cubicle",
        "Senior Leads Cubicle",
        "Manager Cubicle",
        "Video Conferencing",
        "Executive Cabin",
        "CEO Cabin",
      ],
    },

    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    minimumPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    maximumPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    packType: {
      type: String,
      required: true,
      enum: [
        "Per Hour",
        "Per Day",
        "One Week",
        "Two Weeks",
        "Three Weeks",
        "Per Month",
      ],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default Coupon;
