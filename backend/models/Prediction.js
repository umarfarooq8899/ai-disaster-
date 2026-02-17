const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
    disasterType: {
        type: String,
        required: true,
        enum: ["flood", "earthquake", "fire"],
    },
    location: {
        type: String,
        required: true,
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    rainfall: {
        type: Number,
        default: 0,
    },
    temperature: {
        type: Number,
        default: 0,
    },
    windSpeed: {
        type: Number,
        default: 0,
    },
    historicalFrequency: {
        type: Number,
        default: 0,
    },
    riskScore: {
        type: Number,
    },
    riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
    },
    predictedRadius: {
        type: Number,
    },
    status: {
        type: String,
        enum: ["Predicted", "Verified", "Action Taken", "False Alarm"],
        default: "Predicted",
    },
    adminAction: {
        type: String,
    },
    actionTakenAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Prediction", predictionSchema);
