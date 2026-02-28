// models/RescueCoordinator.js
const mongoose = require("mongoose");

// Rescue coordinators are technically users with role "rescue"
// This model extends the User with organization info if needed
const rescueCoordinatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Link to RescueOrganization
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RescueOrganization",
      required: true,
    },

    phone: { type: String }, // optional extra field
    address: { type: String }, // optional

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RescueCoordinator", rescueCoordinatorSchema);
