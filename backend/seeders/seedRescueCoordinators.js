const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const RescueOrganization = require("../models/RescueOrganization");

const DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster";

mongoose
  .connect(DB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

async function seed() {
  try {
    // Clear existing coordinators and organizations
    await User.deleteMany({ role: "rescue_coordinator" });
    await RescueOrganization.deleteMany({});

    const orgs = [
      "Rescue 1122",
      "Edhi Foundation",
      "Al-Khidmat Foundation",
      "Pakistan Red Crescent",
    ];

    for (const name of orgs) {
      // Create organization
      const org = await RescueOrganization.create({ name });
      console.log(`🏢 Created organization: ${name}`);

      // Create coordinator user
      const coordinatorEmail = `${name.replace(/\s+/g, "").toLowerCase()}@coord.com`;
      const coordinator = await User.create({
        name: `${name} Coordinator`,
        email: coordinatorEmail,
        password: "password123", // will be hashed automatically
        role: "rescue_coordinator",
        organization: org._id,
      });

      console.log(`👤 Coordinator created for ${name}: ${coordinatorEmail}`);
    }

    console.log("🎉 Rescue organizations and coordinators seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
