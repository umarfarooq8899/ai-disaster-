const mongoose = require("mongoose");
require("dotenv").config();

const DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster";

mongoose.connect(DB_URI)
    .then(async () => {
        console.log("MongoDB connected ✅");

        const Disaster = require("./models/Disaster");

        // Get total count
        const totalCount = await Disaster.countDocuments();
        console.log("\n=== TOTAL DISASTERS ===");
        console.log("Total disasters in DB:", totalCount);

        // Get counts by status
        const statuses = ["pending", "active", "resolved", "rejected"];
        console.log("\n=== BY STATUS ===");
        for (const status of statuses) {
            const count = await Disaster.countDocuments({ status });
            console.log(`${status}:`, count);
        }

        // Get all disasters
        const allDisasters = await Disaster.find().select("title status createdAt");
        console.log("\n=== ALL DISASTERS ===");
        allDisasters.forEach((d, i) => {
            console.log(`${i + 1}. "${d.title}" - Status: ${d.status} - Created: ${d.createdAt.toLocaleDateString()}`);
        });

        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });
