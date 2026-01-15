const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const NgoOrganization = require("../models/NgoOrganization");

const DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster";

async function seed() {
    try {
        await mongoose.connect(DB_URI);
        console.log("✅ MongoDB connected");

        const orgs = [
            "Edhi Foundation",
            "Al-Khidmat Foundation",
            "Saylani Welfare",
            "Aman Foundation",
        ];

        // Clear existing coordinators and organizations
        await User.deleteMany({ role: "ngo_coordinator" });

        // Also delete by email specifically to avoid duplicate key errors if roles mismatch
        const emails = orgs.map(name => `${name.replace(/\s+/g, "").toLowerCase()}@coord.com`);
        await User.deleteMany({ email: { $in: emails } });

        await NgoOrganization.deleteMany({});


        for (const name of orgs) {
            // Create organization
            const org = await NgoOrganization.create({ name });
            console.log(`🏢 Created NGO organization: ${name}`);

            // Create coordinator user
            const coordinatorEmail = `${name.replace(/\s+/g, "").toLowerCase()}@coord.com`;
            const coordinator = await User.create({
                name: `${name} Coordinator`,
                email: coordinatorEmail,
                password: "password123", // will be hashed automatically
                role: "ngo_coordinator",
                organization: org._id,
            });

            console.log(`👤 Coordinator created for ${name}: ${coordinatorEmail}`);
        }

        console.log("🎉 NGO organizations and coordinators seeded successfully");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seed();
