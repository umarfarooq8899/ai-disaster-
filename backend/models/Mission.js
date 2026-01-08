const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "RescueOrganization", required: true },
    assignedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
    status: { type: String, enum: ["pending", "ongoing", "completed"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mission", missionSchema);
