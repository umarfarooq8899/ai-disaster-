const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const Statistic = require("../models/Statistic");

// ⬇️ IMPORT MODELS FOR DASHBOARD
const User = require("../models/User");
const Disaster = require("../models/Disaster");
const Alert = require("../models/Alert");

/* ==============================
   DASHBOARD STATISTICS (ADMIN)
================================ */
router.get("/dashboard", auth, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers,
      totalVolunteers,
      totalNGOs,
      totalDisasters,
      activeDisasters,
      resolvedDisasters,
      activeAlerts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "volunteer" }),
      User.countDocuments({ role: "ngo" }),
      Disaster.countDocuments(),
      Disaster.countDocuments({ status: "active" }),
      Disaster.countDocuments({ status: "resolved" }),
      Alert.countDocuments({ status: "active" }),
    ]);

    res.json({
      totalUsers,
      totalVolunteers,
      totalNGOs,
      totalDisasters,
      activeDisasters,
      resolvedDisasters,
      activeAlerts,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Failed to load dashboard statistics" });
  }
});

/* ==============================
   EXISTING STATISTIC CRUD
================================ */

// Get all statistics (admin only)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const stats = await Statistic.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new statistic (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { title, value } = req.body;

    if (!title || value == null)
      return res.status(400).json({ message: "All fields required" });

    const stat = new Statistic({
      title,
      value,
      createdBy: req.user._id,
    });

    await stat.save();
    res.status(201).json(stat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete statistic (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await Statistic.findByIdAndDelete(req.params.id);
    res.json({ message: "Statistic deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
