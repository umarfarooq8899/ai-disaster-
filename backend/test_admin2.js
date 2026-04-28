const axios = require("axios");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster");
  const User = require("./models/User");
  
  const adminUser = await User.findOne({ role: "admin" });
  if(!adminUser) {
    console.log("No admin user found");
    process.exit(1);
  }
  
  const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}` };

  const endpoints = [
    "/api/admin/alerts",
    "/api/admin/users",
    "/api/admin/mission-history",
    "/api/admin/all",  // This is in disasters.js but the frontend might be hitting /api/disasters/admin/all
    "/api/organizations/ngo",
    "/api/organizations/rescue"
  ];

  for (const ep of endpoints) {
    try {
      console.log(`\nFetching ${ep}...`);
      const res = await axios.get(`http://localhost:5001${ep}`, { headers });
      console.log(`Success ${ep}, data length:`, Array.isArray(res.data) ? res.data.length : Object.keys(res.data));
    } catch(e) {
      console.error(`Error ${ep}:`);
      if(e.response) {
        console.error("Status:", e.response.status, e.response.data);
      } else {
        console.error(e.message);
      }
    }
  }

  // Also try /api/disasters/admin/all because of `router.get("/admin/all")` in disasters.js
  try {
    console.log(`\nFetching /api/disasters/admin/all...`);
    const res = await axios.get(`http://localhost:5001/api/disasters/admin/all`, { headers });
    console.log(`Success, length:`, res.data.length);
  } catch(e) {
    console.error(`Error:`, e.response ? e.response.status : e.message);
  }

  process.exit(0);
}
run();
