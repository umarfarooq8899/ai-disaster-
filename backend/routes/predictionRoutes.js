const express = require("express");
const router = express.Router();
const {
    generatePredictions,
    getAllPredictions,
    updatePredictionStatus,
    predictRisk
} = require("../controllers/predictionController");
const { protect, authorize } = require("../middleware/auth");

// Public can view
router.get("/", getAllPredictions);

// Admin can generate and update
router.post("/generate", protect, authorize("admin", "system", "rescue_coordinator"), generatePredictions);
router.patch("/:id/action", protect, authorize("admin", "rescue_coordinator"), updatePredictionStatus);

// Keep legacy for now or remove
router.post("/predict", predictRisk);

module.exports = router;
