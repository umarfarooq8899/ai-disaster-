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
        status: {
            type: String,
            enum: ["pending", "assigned", "distributed", "in_transit"], // Adding in_transit for realistic flow
            default: "pending"
        },
        notes: String,
        evidenceUrls: [{ type: String }], // Array of image URLs/paths
    },
    { timestamps: true }
);

module.exports = mongoose.model("AidAssignment", aidAssignmentSchema);
