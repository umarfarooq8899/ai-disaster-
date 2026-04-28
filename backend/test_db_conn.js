const mongoose = require('mongoose');
const uri = "mongodb+srv://uf126322_db_user:RtKUtNOJ33W0f2pD@cluster0.wqdxwif.mongodb.net/disaster?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to MongoDB!");
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log("Users in DB:", users.length);
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection failed:", err);
    process.exit(1);
  });
