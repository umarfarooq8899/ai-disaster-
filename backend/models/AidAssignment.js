const mongoose = require("mongoose");

const aidAssignmentSchema = new mongoose.Schema(
    {
        disaster: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Disaster",
            required: true
        },
        ngo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NgoOrganization",
            required: true
        },
        items: [
            {
                resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
                name: String, // Snapshot of resource name
                quantity: { type: Number, required: true },
            }
        ],
        volunteers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        taskDescription: { type: String }, // Detailed task assigned by coordinator to volunteers
        status: {
            type: String,
            enum: ["pending", "assigned", "pending_verification", "completed", "distributed", "in_transit"],
            default: "pending"
        },
        notes: String,
        evidenceUrls: [{ type: String }], // Global evidence (if needed or left for backwards compatibility)
        volunteerCompletions: [{
            volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            status: { type: String, enum: ["assigned", "pending_verification", "verified"], default: "assigned" },
            evidenceUrls: [{ type: String }],
            submittedAt: { type: Date }
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("AidAssignment", aidAssignmentSchema);
