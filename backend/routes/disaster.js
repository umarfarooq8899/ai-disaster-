const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Disaster = require("../models/Disaster");

// Create Disaster Report
router.post("/", auth, async (req, res) => {
  try {
    const newDisaster = new Disaster({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      severity: req.body.severity,
      reportedBy: req.user.id,
    });

    const saved = await newDisaster.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Get All Disasters
router.get("/", async (req, res) => {
  try {
    const disasters = await Disaster.find().sort({ createdAt: -1 });
    res.json(disasters);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
