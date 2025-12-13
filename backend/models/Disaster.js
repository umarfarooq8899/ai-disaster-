const mongoose = require("mongoose");

const disasterSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    location: String,
    severity: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Disaster", disasterSchema);
