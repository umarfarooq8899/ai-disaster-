const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-disaster');
  const User = require('./models/User');
  const Disaster = require('./models/Disaster');
  const NgoOrganization = require('./models/NgoOrganization');
  
  const adminUser = await User.findOne({ role: 'admin' });
  const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  const disaster = await Disaster.findOne({ status: 'active' });
  const org = await NgoOrganization.findOne();
  
  if (!disaster || !org) {
    console.log('No active disaster or org found');
    process.exit(0);
  }
  
  try {
    const res = await axios.post('http://localhost:5001/api/disasters/assign/aid', {
      disasterId: disaster._id,
      organizationId: org._id,
      items: [{ name: 'Food', quantity: 100 }],
      notes: 'Test Notes'
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
