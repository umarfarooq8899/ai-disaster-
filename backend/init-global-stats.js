const mongoose = require("mongoose");
require("dotenv").config();

const DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster";

mongoose.connect(DB_URI)
    .then(async () => {
        console.log("MongoDB connected ✅");

        const Disaster = require("./models/Disaster");
        const GlobalStats = require("./models/GlobalStats");

        // Count current disasters in database
        const currentCount = await Disaster.countDocuments();
        console.log(`\nCurrent disasters in database: ${currentCount}`);

        // Initialize or update the global stats counter
        let globalStats = await GlobalStats.findById("global");

        if (!globalStats) {
            // Create new with current count
            globalStats = await GlobalStats.create({
                _id: "global",
                totalDisastersReported: currentCount
            });
            console.log(`✅ Initialized GlobalStats with totalDisastersReported: ${currentCount}`);
        } else {
            console.log(`ℹ️ GlobalStats already exists with totalDisastersReported: ${globalStats.totalDisastersReported}`);
            console.log(`   To reset to current database count, run this script with --force flag`);

            // Check if force flag is provided
            if (process.argv.includes("--force")) {
                globalStats.totalDisastersReported = currentCount;
                await globalStats.save();
                console.log(`✅ Force updated totalDisastersReported to: ${currentCount}`);
            }
        }

        console.log("\n✅ Initialization complete!");
        console.log(`   Total Disasters (all-time): ${globalStats.totalDisastersReported}`);
        console.log(`   Current Disasters in DB: ${currentCount}`);
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
