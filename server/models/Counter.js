import mongoose from "mongoose";

// Generic counter used for gap-free sequences (e.g. one per financial year).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "invoice-2627"
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter ||
  mongoose.model("Counter", counterSchema);
