const axios = require("axios");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster");
  const User = require("./models/User");
  
  const adminUser = await User.findOne({ role: "admin" });
  if(!adminUser) { console.log("No admin user found"); process.exit(1); }
  
  const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}` };

  const endpoints = [
    "/api/users",              // ManageUsers.jsx hits UserAPI.getAllUsers -> GET /users
    "/api/admin/alerts",       // ManageAlerts.jsx hits GET /admin/alerts
    "/api/admin/mission-history", // MissionHistory.jsx hits GET /admin/mission-history
    "/api/admin/aid-history",     // MissionHistory.jsx hits GET /admin/aid-history
    "/api/disasters/admin/all",// ManageDisasters hits GET /disasters/admin/all
    "/api/disasters/orgs/rescue", // fetchOrgs
    "/api/disasters/orgs/ngo", // fetchOrgs
    "/api/organizations/ngo",  // ManageOrganizations hits GET /organizations/ngo
    "/api/organizations/rescue"// ManageOrganizations hits GET /organizations/rescue
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

  process.exit(0);
}
run();
