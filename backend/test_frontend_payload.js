const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-disaster');
  const User = require('./models/User');
  const Disaster = require('./models/Disaster');
  const RescueOrganization = require('./models/RescueOrganization');
  
  const adminUser = await User.findOne({ role: 'admin' });
  const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  const disaster = await Disaster.findOne({ status: 'active' });
  const org = await RescueOrganization.findOne();
  
  if (!disaster || !org) {
    console.log('No active disaster or org found');
    process.exit(0);
  }
  
  try {
    const payload = {
        disasterId: disaster._id.toString(),
        organizationId: org._id.toString(),
        title: "Test Title",
        description: "Test Desc",
        skills: ["medical", "rescue"],
        volunteersRequired: 1,
        ambulancesRequired: 2,
        firefightersRequired: 3,
        items: [],
        notes: ""
    };
    
    // Clean up payload based on type
    delete payload.items;
    delete payload.notes;
    payload.skillsRequired = payload.skills;
    
    const res = await axios.post('http://localhost:5001/api/disasters/assign/rescue', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data);
  } catch(e) {
    console.error('Error:', e.response ? e.response.data : e.message);
  }
  process.exit(0);
}
run();
