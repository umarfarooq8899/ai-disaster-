const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const admins = [
  { name:"Admin One", email:"admin1@disaster.com", password:"Admin@123", role:"admin" },
  { name:"Admin Two", email:"admin2@disaster.com", password:"Admin@123", role:"admin" }
];

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for admin seeding");

    for (const admin of admins) {
      const exists = await User.findOne({ email: admin.email });
      if (!exists) {
        const hashed = await bcrypt.hash(admin.password,10);
        await User.create({ ...admin, password:hashed });
        console.log(`Created admin: ${admin.email}`);
      }
    }
    console.log("Admin seeding completed"); process.exit();
  } catch (err) { console.error(err); process.exit(1); }
};

seedAdmins();
