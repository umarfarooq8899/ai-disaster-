const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Models
const User = require("../models/User");
const Disaster = require("../models/Disaster");
const Mission = require("../models/Mission");
const AidAssignment = require("../models/AidAssignment");
const RescueOrganization = require("../models/RescueOrganization");
const NgoOrganization = require("../models/NgoOrganization");
const StatusLog = require("../models/StatusLog");

// Utils
const uniqueId = () => Math.random().toString(36).substring(7);

async function runVerification() {
    try {
        console.log("--------------------------------------------------");
        console.log("   STARTING VERIFICATION: Disaster Mgmt Flow");
        console.log("--------------------------------------------------");

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // 1. SETUP DATA
        const suffix = uniqueId();

        // Create Orgs
        const rescueOrg = await RescueOrganization.create({
            name: `Rescue One ${suffix}`,
            location: "Lahore"
        });
        const ngoOrg = await NgoOrganization.create({
            name: `Edhi Foundation ${suffix}`,
            location: "Karachi"
        });
        console.log("✅ Organizations Created");

        // Create Users
        const admin = await User.create({
            name: "Admin User",
            email: `admin_${suffix}@test.com`,
            password: "password123",
            role: "admin"
        });
        const rescueCoord = await User.create({
            name: "Rescue Coord",
            email: `rescue_${suffix}@test.com`,
            password: "password123",
            role: "rescue_coordinator",
            organization: rescueOrg._id,
            organizationType: "RescueOrganization"
        });
        const ngoCoord = await User.create({
            name: "NGO Coord",
            email: `ngo_${suffix}@test.com`,
            password: "password123",
            role: "ngo_coordinator",
            organization: ngoOrg._id,
            organizationType: "NgoOrganization"
        });
        console.log("✅ Users Created");

        // 2. REPORT DISASTER
        const disaster = await Disaster.create({
            title: `Flood in Sector F_${suffix}`,
            description: "Heavy flooding, people stuck.",
            location: "Islamabad Sector F",
            severity: "high",
            status: "pending",
            reportedBy: admin._id // Simulating user report
        });
        console.log(`✅ Disaster Reported: ${disaster.title} (Status: ${disaster.status})`);

        // 3. ADMIN VERIFY
        disaster.status = "active";
        await disaster.save();
        console.log(`✅ Admin Verified: Status is now ${disaster.status}`);

        // 4. ADMIN ASSIGN RESCUE
        const mission = await Mission.create({
            title: "Rescue Operation Alpha",
            description: "Evacuate rooftop residents",
            location: disaster.location,
            organization: rescueOrg._id,
            disaster: disaster._id,
            status: "pending"
        });
        console.log(`✅ Admin Assigned Rescue Mission: ${mission.title}`);

        // 5. ADMIN ASSIGN NGO
        const assignment = await AidAssignment.create({
            disaster: disaster._id,
            ngo: ngoOrg._id,
            items: [{ name: "Food Packets", quantity: 500 }],
            status: "assigned"
        });
        console.log(`✅ Admin Assigned NGO Aid: ${assignment.items[0].name}`);

        // 6. RESCUE UPDATE STATUS
        const rescueLog = await StatusLog.create({
            disaster: disaster._id,
            mission: mission._id,
            organization: rescueOrg._id,
            organizationType: "RescueOrganization",
            updateType: "rescued",
            description: "Rescued 10 people from roof",
            metrics: { count: 10 }
        });
        console.log(`✅ Rescue Team Logged Update: ${rescueLog.description}`);

        // 7. NGO UPDATE STATUS
        const ngoLog = await StatusLog.create({
            disaster: disaster._id,
            aidAssignment: assignment._id,
            organization: ngoOrg._id,
            organizationType: "NgoOrganization",
            updateType: "food",
            description: "Distributed 200 packets",
            metrics: { count: 200 }
        });
        console.log(`✅ NGO Team Logged Update: ${ngoLog.description}`);

        // 8. VERIFY LOGS EXIST
        const logs = await StatusLog.find({ disaster: disaster._id });
        if (logs.length === 2) {
            console.log("✅ SUCCESS: All logs verified in system.");
        } else {
            console.error("❌ FAILURE: Logs missing. Found:", logs.length);
        }

        console.log("--------------------------------------------------");
        console.log("   VERIFICATION COMPLETE");
        console.log("--------------------------------------------------");

        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR:", err);
        process.exit(1);
    }
}

runVerification();
