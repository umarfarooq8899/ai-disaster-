const express = require("express");
const router = express.Router();

// Middleware
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Model
const Disaster = require("../models/Disaster");

// ================== Routes ==================

// Create disaster report (any logged-in user)
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all disasters (any user)
router.get("/", async (req, res) => {
  try {
    const disasters = await Disaster.find().sort({ createdAt: -1 });
    res.json(disasters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: resolve disaster
router.patch("/:id/resolve", auth, adminOnly, async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id);
    if (!disaster) return res.status(404).json({ message: "Disaster not found" });

    disaster.status = "resolved";
    await disaster.save();
    res.json(disaster);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: delete disaster
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await Disaster.findByIdAndDelete(req.params.id);
    res.json({ message: "Disaster deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
