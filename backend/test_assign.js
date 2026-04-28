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
    const res = await axios.post('http://localhost:5001/api/disasters/assign/rescue', {
      disasterId: disaster._id,
      organizationId: org._id,
      title: 'Test Title',
      description: 'Test Desc',
      skillsRequired: [],
      volunteersRequired: 1,
      ambulancesRequired: 1,
      firefightersRequired: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data);
  } catch(e) {
    console.error('Error:', e.response ? e.response.data : e.message);
  }
  process.exit(0);
}
run();
