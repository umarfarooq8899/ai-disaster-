// models/NgoOrganization.js
const mongoose = require("mongoose");
const ngoOrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("NgoOrganization", ngoOrganizationSchema);
