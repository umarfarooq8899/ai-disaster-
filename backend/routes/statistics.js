const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const statisticController = require("../controllers/statisticController");

// Admin: get all statistics
router.get("/", auth, adminOnly, statisticController.getAllStatistics);

// Admin: create a new statistic
router.post("/", auth, adminOnly, statisticController.createStatistic);

module.exports = router;
