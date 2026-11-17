import mongoose from "mongoose";

const virtualOfficePriceSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    gstRate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

virtualOfficePriceSchema.index({ isActive: 1 });

const VirtualOfficePrice = mongoose.model(
  "VirtualOfficePrice",
  virtualOfficePriceSchema,
);

export default VirtualOfficePrice;
