const express = require("express");
const router = express.Router();

// Middleware
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Model
const Alert = require("../models/Alert");

// ================== Routes ==================

// Create alert (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { title, message, severity, location } = req.body;
    if (!title || !message || !severity || !location)
      return res.status(400).json({ message: "All fields required" });

    const alert = new Alert({
      title,
      message,
      severity,
      location,
      createdBy: req.user.id,
      status: "active",
    });

    const saved = await alert.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active alerts (any user)
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find({ status: "active" }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: update alert
router.patch("/:id", auth, adminOnly, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    Object.assign(alert, req.body);
    await alert.save();
    res.json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: deactivate alert
router.patch("/:id/deactivate", auth, adminOnly, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    alert.status = "inactive";
    await alert.save();
    res.json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: delete alert
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: "Alert deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
