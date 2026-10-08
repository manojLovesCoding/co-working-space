import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    /*
     * Role is used for authorization.
     *
     * Example:
     * admin
     * customer
     * tenant
     */
    role: {
      type: String,
      enum: ["customer", "tenant", "admin"],
      default: "tenant",
    },

    /*
     * Designation is profile information.
     *
     * Example:
     * Manager
     * Accountant
     * Receptionist
     * Software Developer
     */
    designation: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Date of birth
     */
    dob: {
      type: Date,
      default: null,
    },

    /*
     * User address
     */
    address: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Cloudinary profile image URL
     */
    profilePic: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);