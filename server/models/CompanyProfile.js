import mongoose from "mongoose";

const companyProfileSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    gstNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    // Cloudinary secure URL
    logo: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "CompanyProfile",
  companyProfileSchema
);