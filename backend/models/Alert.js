const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    target: { type: String, required: true },
    message: { type: String },
    severity: { type: String },
    location: { type: String },
    status: { type: String, enum: ["Active", "Disabled"], default: "Active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes
alertSchema.index({ status: 1 });
alertSchema.index({ type: 1 });

module.exports = mongoose.model("Alert", alertSchema);
