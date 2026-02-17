const Prediction = require("../models/Prediction");

// Simulated Pakistan Cities Data
const PAKISTAN_CITIES = [
    { name: "Karachi", lat: 24.8607, lng: 67.0011, baseRisk: "flood" },
    { name: "Lahore", lat: 31.5497, lng: 74.3436, baseRisk: "flood" },
    { name: "Islamabad", lat: 33.6844, lng: 73.0479, baseRisk: "earthquake" },
    { name: "Quetta", lat: 30.1798, lng: 66.9750, baseRisk: "earthquake" },
    { name: "Peshawar", lat: 34.0151, lng: 71.5249, baseRisk: "flood" },
    { name: "Multan", lat: 30.1575, lng: 71.5249, baseRisk: "fire" }, // High heat
    { name: "Gwadar", lat: 25.1216, lng: 62.3254, baseRisk: "flood" }, // Tsunami/Cyclone
    { name: "Gilgit", lat: 35.9208, lng: 74.3089, baseRisk: "earthquake" },
];

// @desc    Generate Random Predictions for Pakistan (Simulation)
// @route   POST /api/predictions/generate
// @access  Private (Admin/System)
exports.generatePredictions = async (req, res) => {
    try {
        const generated = [];

        for (const city of PAKISTAN_CITIES) {
            // Simulate variability
            const rain = Math.random() * 200; // 0-200mm
            const wind = Math.random() * 100; // 0-100km/h
            const history = Math.random() * 100; // 0-100 frequency (mock)
            const temp = 20 + Math.random() * 30; // 20-50 C

            // Influence based on baseRisk
            let rainfall = rain;
            let windSpeed = wind;
            let historicalFrequency = history;

            if (city.baseRisk === "flood") rainfall += 50; // Bias towards flood
            if (city.baseRisk === "earthquake") historicalFrequency += 30; // Bias towards earthquake history

            // Rule-based Score
            const riskScore =
                (rainfall * 0.4) + (windSpeed * 0.3) + (historicalFrequency * 0.3);

            let riskLevel = "low";
            let predictedRadius = 2;
            let disasterType = city.baseRisk; // Default to known risk

            if (riskScore < 40) {
                riskLevel = "low";
                predictedRadius = 2;
            } else if (riskScore >= 40 && riskScore <= 70) {
                riskLevel = "medium";
                predictedRadius = 5;
            } else {
                riskLevel = "high";
                predictedRadius = 15;
            }

            // Randomly change disaster type if params fit others better
            if (temp > 40 && rainfall < 10) disasterType = "fire";
            if (rainfall > 150) disasterType = "flood";

            // Only save actionable/interesting predictions or occasional low risk for coverage
            // For demo, save everything > 50 score OR random chance
            if (riskScore > 50 || Math.random() > 0.7) {
                const prediction = await Prediction.create({
                    disasterType,
                    location: city.name,
                    latitude: city.lat,
                    longitude: city.lng,
                    rainfall: Math.round(rainfall),
                    temperature: Math.round(temp),
                    windSpeed: Math.round(windSpeed),
                    historicalFrequency: Math.round(historicalFrequency),
                    riskScore: Math.round(riskScore),
                    riskLevel,
                    predictedRadius,
                    status: "Predicted",
                });
                generated.push(prediction);
            }
        }

        res.status(201).json({ success: true, count: generated.length, data: generated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get All Predictions
// @route   GET /api/predictions
// @access  Public (or Protected)
exports.getAllPredictions = async (req, res) => {
    try {
        const predictions = await Prediction.find().sort({ createdAt: -1 });
        res.json({ success: true, count: predictions.length, data: predictions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Take Action on Prediction
// @route   PATCH /api/predictions/:id/action
// @access  Private (Admin)
exports.updatePredictionStatus = async (req, res) => {
    try {
        const { status, adminAction } = req.body;

        const prediction = await Prediction.findById(req.params.id);
        if (!prediction) {
            return res.status(404).json({ success: false, message: "Prediction not found" });
        }

        prediction.status = status || prediction.status;
        prediction.adminAction = adminAction || prediction.adminAction;
        if (status === "Action Taken" || status === "Verified") {
            prediction.actionTakenAt = Date.now();
        }

        await prediction.save();

        res.json({ success: true, data: prediction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Legacy single predict (optional kep for reference or single testing)
exports.predictRisk = async (req, res) => {
    // ... keep existing logic if needed, or deprecate
    // For now, I will overwrite the file entirely with the new monitoring logic 
    // but I should keep the old predictRisk if I want to support manual entry still?
    // The requirements seem to imply "automatically show all... user will see all".
    // I'll keep the single predictRisk just in case, but the main focus is the list.
    // Actually, to keep the file clean, I'll just replace it with the new logic completely.
    // User said "automtically show all... list", so generation is key.
    res.json({ message: "Use /generate for batch predictions." });
};
