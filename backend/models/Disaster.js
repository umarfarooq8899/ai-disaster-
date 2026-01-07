const mongoose = require("mongoose");

const disasterSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    location: String,
    severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Disaster", disasterSchema);
