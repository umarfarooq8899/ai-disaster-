const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const RescueOrganization = require("../models/RescueOrganization");

const uniqueId = () => Math.random().toString(36).substring(7);

async function runVerification() {
    try {
        console.log("--- STARTING VOLUNTEER VISIBILITY TEST ---");
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Create Org
        const org = await RescueOrganization.create({
            name: `Test Rescue ${uniqueId()}`,
            location: "Test City"
        });
        console.log("✅ Organization Created");

        // 2. Create User (Simulate Signup WITHOUT Profile Completion)
        const user = await User.create({
            name: "Incomplete Volunteer",
            email: `incomp_${uniqueId()}@test.com`,
            password: "password",
            role: "volunteer",
            organization: org._id,
            organizationType: "RescueOrganization"
        });
        console.log("✅ User Created (Incomplete Profile)");

        // 3. Verify NOT in Volunteer Collection
        const volDoc = await Volunteer.findOne({ user: user._id });
        if (!volDoc) {
            console.log("✅ Confirmed: No Volunteer document exists.");
        } else {
            console.error("❌ Unexpected: Volunteer document exists.");
        }

        // 4. Test Controller Logic (Simulated)
        // We replicate the logic we just wrote to ensure it picks up this user
        const volunteers = await Volunteer.find({ organization: org._id }).populate("user");
        const registeredUserIds = volunteers.map(v => v.user._id.toString());

        const incompleteUsers = await User.find({
            organization: org._id,
            role: "volunteer",
            _id: { $nin: registeredUserIds }
        });

        if (incompleteUsers.length === 1 && incompleteUsers[0]._id.toString() === user._id.toString()) {
            console.log("✅ SUCCESS: Incomplete user found by new logic.");
        } else {
            console.error("❌ FAILURE: Incomplete user NOT found. Found:", incompleteUsers.length);
        }

        console.log("--- TEST COMPLETE ---");
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runVerification();
