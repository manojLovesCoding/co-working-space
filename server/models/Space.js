import mongoose from "mongoose";

const spaceSchema = new mongoose.Schema(
  {
    spaceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    space: {
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
      trim: true,
    },

    perHour: {
      type: Number,
      default: null,
      min: 0,
    },

    perDay: {
      type: Number,
      default: null,
      min: 0,
    },

    oneWeek: {
      type: Number,
      default: null,
      min: 0,
    },

    twoWeeks: {
      type: Number,
      default: null,
      min: 0,
    },

    threeWeeks: {
      type: Number,
      default: null,
      min: 0,
    },

    perMonth: {
      type: Number,
      default: null,
      min: 0,
    },

    minDuration: {
      type: Number,
      default: null,
      min: 0,
    },

    minDurationDesc: {
      type: String,
      default: "",
      trim: true,
    },

    maxDuration: {
      type: Number,
      default: null,
      min: 0,
    },

    maxDurationDesc: {
      type: String,
      default: "",
      trim: true,
    },

    // Cloudinary secure URL
    image: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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

export default mongoose.model("Space", spaceSchema);
