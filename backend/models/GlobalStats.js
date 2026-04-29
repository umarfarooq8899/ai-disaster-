const mongoose = require("mongoose");

const globalStatsSchema = new mongoose.Schema(
    {
        // Singleton document - only one record with _id = "global"
        _id: { type: String, default: "global" },

        // Cumulative counters (increment only, never decrement)
        totalDisastersReported: { type: Number, default: 0 },
        totalAlertsCreated: { type: Number, default: 0 },
        totalMissionsCreated: { type: Number, default: 0 },
        totalAidAssignmentsCreated: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Static method to increment a counter atomically
globalStatsSchema.statics.incrementCounter = async function (field, amount = 1) {
    return this.findByIdAndUpdate(
        "global",
        { $inc: { [field]: amount } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

// Static method to sync stats with actual counts
globalStatsSchema.statics.syncStats = async function () {
    const Disaster = mongoose.model("Disaster");
    const Alert = mongoose.model("Alert");
    const Mission = mongoose.model("Mission");
    const AidAssignment = mongoose.model("AidAssignment");

    const [disasters, alerts, missions, aid] = await Promise.all([
        Disaster.countDocuments(),
        Alert.countDocuments(),
        Mission.countDocuments(),
        AidAssignment.countDocuments(),
    ]);

    return this.findByIdAndUpdate(
        "global",
        {
            totalDisastersReported: disasters,
            totalAlertsCreated: alerts,
            totalMissionsCreated: missions,
            totalAidAssignmentsCreated: aid,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

// Static method to get current stats
globalStatsSchema.statics.getStats = async function () {
    let stats = await this.findById("global");
    if (!stats) {
        // Initialize if doesn't exist
        stats = await this.syncStats(); // Sync on first creation
    }
    return stats;
};

module.exports = mongoose.model("GlobalStats", globalStatsSchema);
