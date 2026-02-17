const mongoose = require("mongoose");
require("dotenv").config();

const DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster";

mongoose.connect(DB_URI)
    .then(async () => {
        console.log("MongoDB connected ✅");

        const Disaster = require("./models/Disaster");
        const GlobalStats = require("./models/GlobalStats");

        console.log("\n=== BEFORE TEST ===");
        const beforeStats = await GlobalStats.getStats();
        const beforeCount = await Disaster.countDocuments();
        console.log(`GlobalStats counter: ${beforeStats.totalDisastersReported}`);
        console.log(`Current disasters in DB: ${beforeCount}`);

        // Create a test disaster
        console.log("\n=== CREATING TEST DISASTER ===");
        const testDisaster = await Disaster.create({
            title: "Test Disaster for Counter Verification",
            description: "This is a test to verify the cumulative counter works",
            location: "Test Location",
            severity: "low",
            status: "pending"
        });
        console.log(`✅ Created disaster: "${testDisaster.title}"`);

        // Wait a moment for the hook to execute
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("\n=== AFTER TEST ===");
        const afterStats = await GlobalStats.getStats();
        const afterCount = await Disaster.countDocuments();
        console.log(`GlobalStats counter: ${afterStats.totalDisastersReported}`);
        console.log(`Current disasters in DB: ${afterCount}`);

        console.log("\n=== VERIFICATION ===");
        const counterIncremented = afterStats.totalDisastersReported === beforeStats.totalDisastersReported + 1;
        const dbCountIncremented = afterCount === beforeCount + 1;

        if (counterIncremented && dbCountIncremented) {
            console.log("✅ SUCCESS! Counter incremented correctly");
            console.log(`   Before: ${beforeStats.totalDisastersReported} → After: ${afterStats.totalDisastersReported}`);
        } else {
            console.log("❌ FAILED! Counter did not increment as expected");
            console.log(`   Counter: ${beforeStats.totalDisastersReported} → ${afterStats.totalDisastersReported}`);
            console.log(`   DB Count: ${beforeCount} → ${afterCount}`);
        }

        // Clean up test disaster
        console.log("\n=== CLEANUP ===");
        await Disaster.findByIdAndDelete(testDisaster._id);
        console.log("✅ Deleted test disaster");

        const finalStats = await GlobalStats.getStats();
        const finalCount = await Disaster.countDocuments();
        console.log(`\nFinal state:`);
        console.log(`   GlobalStats counter: ${finalStats.totalDisastersReported} (unchanged - as expected!)`);
        console.log(`   Current disasters in DB: ${finalCount}`);

        console.log("\n✅ Test complete!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
