const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    phone: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },

    skills: {
      type: [String],
      required: true,
      default: [],
    },

    organizationType: {
      type: String,
      enum: ["RescueOrganization", "NGOOrganization"],
      required: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "organizationType", // <-- dynamic ref
      default: null,
    },

    available: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Volunteer", volunteerSchema);
