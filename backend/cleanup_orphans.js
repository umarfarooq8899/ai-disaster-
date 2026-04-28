const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-disaster');
  const Mission = require('./models/Mission');
  const AidAssignment = require('./models/AidAssignment');
  const Disaster = require('./models/Disaster');
  const Alert = require('./models/Alert');
  const StatusLog = require('./models/StatusLog');
  
  const missions = await Mission.find();
  for (const m of missions) {
      const d = await Disaster.findById(m.disaster);
      if (!d) {
          console.log('Deleting orphaned mission:', m._id);
          await Mission.findByIdAndDelete(m._id);
      }
  }

  const aids = await AidAssignment.find();
  for (const a of aids) {
      const d = await Disaster.findById(a.disaster);
      if (!d) {
          console.log('Deleting orphaned aid assignment:', a._id);
          await AidAssignment.findByIdAndDelete(a._id);
      }
  }
  
  const alerts = await Alert.find();
  for (const al of alerts) {
      if (al.disaster) {
          const d = await Disaster.findById(al.disaster);
          if (!d) {
              console.log('Deleting orphaned alert:', al._id);
              await Alert.findByIdAndDelete(al._id);
          }
      }
  }

  console.log('Cleanup done');
  process.exit(0);
}
run();
