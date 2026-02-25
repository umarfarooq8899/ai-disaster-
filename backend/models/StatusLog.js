const mongoose = require("mongoose");

const statusLogSchema = new mongoose.Schema(
    {
        disaster: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Disaster",
            required: true,
        },
        mission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mission",
        },
        aidAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AidAssignment",
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "organizationType",
        },
        organizationType: {
            type: String,
            enum: ["RescueOrganization", "NgoOrganization"],
        },
        updateType: {
            type: String,
            enum: ["rescued", "cleared", "food", "medical", "shelter", "logistics", "other", "admin_broadcast"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        metrics: {
            type: Map,
            of: Number, // e.g., { "people": 5, "kits": 100 }
        },
        images: [String],
    },
    { timestamps: true }
);

module.exports = mongoose.model("StatusLog", statusLogSchema);
