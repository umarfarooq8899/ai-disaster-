const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., vehicle, medical kit
    quantity: { type: Number, default: 1 },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "RescueOrganization", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
