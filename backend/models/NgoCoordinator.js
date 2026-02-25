// models/NgoCoordinator.js
const mongoose = require("mongoose");

// Ngo coordinators are technically users with role "ngo_coordinator"
const ngoCoordinatorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Link to NgoOrganization
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NgoOrganization",
            required: true,
        },

        phone: { type: String },
        address: { type: String },

        status: {
            type: String,
            enum: ["active", "blocked"],
            default: "active",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("NgoCoordinator", ngoCoordinatorSchema);
