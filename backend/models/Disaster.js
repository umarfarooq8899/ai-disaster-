const mongoose = require("mongoose");

const disasterSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    location: String,
    severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
    status: { type: String, enum: ["pending", "active", "resolved", "rejected"], default: "pending" },
    image: { type: String }, // URL/path to uploaded image
    video: { type: String }, // URL/path to uploaded video
    latitude: { type: Number },
    longitude: { type: Number },
    dangerRadius: { type: Number, default: 5 }, // Radius in kilometers
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Post-save hook to increment cumulative disaster counter
disasterSchema.post("save", async function (doc) {
  // Only increment on new documents (not on updates)
  if (this.isNew) {
    try {
      const GlobalStats = mongoose.model("GlobalStats");
      await GlobalStats.incrementCounter("totalDisastersReported", 1);
      console.log("✅ Incremented global disaster counter");
    } catch (err) {
      console.error("❌ Failed to increment disaster counter:", err);
    }
  }
});

module.exports = mongoose.model("Disaster", disasterSchema);

