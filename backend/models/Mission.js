const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    taskDescription: { type: String }, // Detailed task assigned by coordinator to volunteers
    location: { type: String, required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "RescueOrganization", required: true },
    disaster: { type: mongoose.Schema.Types.ObjectId, ref: "Disaster", required: true },
    assignedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
    skillsRequired: [{ type: String, enum: ["medical", "technical", "rescue", "logistics", "communication"] }],
    status: {
      type: String,
      enum: ["pending", "ongoing", "pending_verification", "completed", "cancelled"],
      default: "pending"
    },
    // Resource requirements set by Admin
    volunteersRequired: { type: Number, default: 0 },
    ambulancesRequired: { type: Number, default: 0 },
    firefightersRequired: { type: Number, default: 0 },
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

// Indexes
missionSchema.index({ organization: 1, status: 1 });
missionSchema.index({ disaster: 1 });
missionSchema.index({ status: 1 });

module.exports = mongoose.model("Mission", missionSchema);
