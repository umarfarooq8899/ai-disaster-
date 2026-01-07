const mongoose = require("mongoose");

const statisticSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    value: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Statistic", statisticSchema);
