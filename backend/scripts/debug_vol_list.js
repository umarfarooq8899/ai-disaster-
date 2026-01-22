const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const Mission = require("../models/Mission"); // Fixed: Required for populate
const RescueOrganization = require("../models/RescueOrganization");

async function runDebug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // 1. Find the Rescue Organization (assuming there's at least one from previous steps)
        const org = await RescueOrganization.findOne();
        if (!org) {
            console.log("❌ No Rescue Organization found.");
            process.exit(1);
        }
        console.log(`🔍 Checking Org: ${org.name} (${org._id})`);

        // 2. Run Dashboard Stat Logic
        const count = await Volunteer.countDocuments({ organization: org._id, available: true });
        console.log(`📊 Dashboard Stats (Available): ${count}`);

        // 3. Run List Logic (Controller Simulation)
        console.log("📋 Fetching List...");
        const volunteers = await Volunteer.find({ organization: org._id })
            .populate("user", "name email status")
            .populate("currentTask", "title status")
            .lean();

        console.log(`   - Found ${volunteers.length} Volunteer docs.`);
        volunteers.forEach((v, i) => {
            console.log(`     [${i}] User: ${v.user ? v.user.name : "NULL"} | Available: ${v.available}`);
        });

        // 4. Run Incomplete Logic
        const registeredUserIds = volunteers.map(v => v.user ? v.user._id : null).filter(id => id);

        const incompleteUsers = await User.find({
            organization: org._id,
            role: "volunteer",
            _id: { $nin: registeredUserIds }
        }).select("name email status").lean();

        console.log(`   - Found ${incompleteUsers.length} Incomplete Users.`);
        incompleteUsers.forEach((u, i) => {
            console.log(`     [${i}] User: ${u.name} | Role: ${u.role}`);
        });

        const merged = [...volunteers, ...incompleteUsers]; // Simplified merge for logging
        console.log(`✅ Total Records Returned: ${merged.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runDebug();
