const mongoose = require("mongoose");

const disasterSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    location: String,
    severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
    status: { type: String, enum: ["pending", "active", "resolved", "rejected"], default: "pending" },
    image: { type: String }, // URL/path to uploaded image
    video: { type: String }, // URL/path to uploaded video
    latitude: { type: Number },
    longitude: { type: Number },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Disaster", disasterSchema);
