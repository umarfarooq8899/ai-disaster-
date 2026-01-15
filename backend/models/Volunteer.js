const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  phone: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  organizationType: { type: String, enum: ["rescue", "ngo"], required: true },
  organization: { type: String, required: true },
  skills: [{ type: String, required: true }],
  available: { type: Boolean, default: false },
});

module.exports = mongoose.model("Volunteer", volunteerSchema);
