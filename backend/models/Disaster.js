const mongoose = require("mongoose");

const disasterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["flood", "earthquake", "fire", "landslide", "storm", "other"],
    },

    description: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Disaster", disasterSchema);
