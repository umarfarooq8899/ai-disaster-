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
            enum: ["pending", "assigned", "distributed"],
            default: "pending"
        },
        notes: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("AidAssignment", aidAssignmentSchema);
