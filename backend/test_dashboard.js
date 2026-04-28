const axios = require("axios");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster");
  const User = require("./models/User");
  
  const adminUser = await User.findOne({ role: "admin" });
  const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}` };

  const ep = "/api/statistics/dashboard";
  try {
    console.log(`Fetching ${ep}...`);
    const res = await axios.get(`http://localhost:5001${ep}`, { headers });
    console.log(`Success ${ep}, data:`, res.data);
  } catch(e) {
    if(e.response) {
      console.error("Status:", e.response.status, e.response.data);
    } else {
      console.error(e.message);
    }
  }
  process.exit(0);
}
run();
