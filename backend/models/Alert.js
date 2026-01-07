const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    target: { type: String, required: true },
    status: { type: String, enum: ["Active", "Disabled"], default: "Active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
