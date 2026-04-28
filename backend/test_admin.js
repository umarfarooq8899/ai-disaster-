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
  
  try {
    console.log("Fetching /api/admin/alerts...");
    const res = await axios.get("http://localhost:5001/api/admin/alerts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Alerts:", res.data);
  } catch(e) {
    console.error("Error fetching alerts:");
    if(e.response) {
      console.error(e.response.status, e.response.data);
    } else {
      console.error(e.message);
    }
  }
  
  try {
    console.log("Fetching /api/admin/missions...");
    const res = await axios.get("http://localhost:5001/api/admin/missions", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Missions length:", res.data.length);
  } catch(e) {
    console.error("Error fetching missions:");
    if(e.response) {
      console.error(e.response.status, e.response.data);
    } else {
      console.error(e.message);
    }
  }

  process.exit(0);
}
run();
