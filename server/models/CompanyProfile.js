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

    /*
     * Cloudinary secure URL
     */
    logo: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Owner of this company profile.
     *
     * User A -> Company A
     * User B -> Company B
     */
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

/*
 * One company profile per user.
 *
 * This prevents:
 *
 * User A -> Company A
 * User A -> Company B
 *
 * A user can have only one company profile.
 */
companyProfileSchema.index(
  { createdBy: 1 },
  { unique: true }
);

export default mongoose.model(
  "CompanyProfile",
  companyProfileSchema
);