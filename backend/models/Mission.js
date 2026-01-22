const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "RescueOrganization", required: true },
    disaster: { type: mongoose.Schema.Types.ObjectId, ref: "Disaster", required: true },
    assignedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
    skillsRequired: [{ type: String, enum: ["medical", "technical", "rescue", "logistics", "communication"] }],
    status: { type: String, enum: ["pending", "ongoing", "completed", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mission", missionSchema);
