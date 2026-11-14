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

    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
      required: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    dob: {
      type: Date,
      default: null,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    profilePic: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
