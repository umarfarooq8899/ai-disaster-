const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String }, // e.g., "Generic Label"
    category: {
      type: String,
      enum: ["Food", "Medicine", "Shelter", "Vehicle", "Equipment", "Other"],
      required: true
    },
    quantity: { type: Number, default: 0 },
    description: { type: String },
    organizationType: {
      type: String,
      enum: ["RescueOrganization", "NgoOrganization"],
      required: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "organizationType",
      required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
