const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  phone: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  organizationType: { type: String, enum: ["RescueOrganization", "NgoOrganization"], required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, refPath: "organizationType", required: true },
  skills: [{ type: String, enum: ["medical", "technical", "rescue", "logistics", "communication"], required: true }],
  available: { type: Boolean, default: false },
  currentTaskType: { type: String, enum: ["Mission", "AidAssignment", null], default: null },
  currentTask: { type: mongoose.Schema.Types.ObjectId, refPath: "currentTaskType", default: null },
  latitude: { type: Number },
  longitude: { type: Number },
});

// Indexes
volunteerSchema.index({ organization: 1, available: 1 });
volunteerSchema.index({ user: 1 });

module.exports = mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);
