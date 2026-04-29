const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect: auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const Statistic = require("../models/Statistic");

// ⬇️ IMPORT MODELS FOR DASHBOARD
const User = require("../models/User");
const Disaster = require("../models/Disaster");
const Alert = require("../models/Alert");
const RescueOrganization = require("../models/RescueOrganization");
const NgoOrganization = require("../models/NgoOrganization");
const Mission = require("../models/Mission");
const AidAssignment = require("../models/AidAssignment");

/*  PUBLIC STATISTICS (AUTHENTICATED) */
router.get("/public", auth, async (req, res) => {
  try {
    const Mission = mongoose.model("Mission");
    const AidAssignment = mongoose.model("AidAssignment");

    const [
      totalUsers,
      totalVolunteers,
      totalNGOs,
      totalRescue,
      totalDisasters,
      activeDisasters,
      activeAlerts,
      totalCompletedMissions,
      totalDistributedAid,
      totalMissions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "volunteer" }),
      NgoOrganization.countDocuments(),
      RescueOrganization.countDocuments(),
      Disaster.countDocuments(),
      Disaster.countDocuments({ status: "active" }),
      Alert.countDocuments({ status: "active" }),
      Mission.countDocuments({ status: "completed" }),
      AidAssignment.countDocuments({ status: "distributed" }),
      Mission.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalVolunteers,
      totalNGOs,
      totalRescue,
      totalDisasters,
      activeDisasters,
      activeAlerts,
      totalCompletedMissions,
      totalDistributedAid,
      totalMissions,
    });
  } catch (err) {
    console.error("Public Stats Error:", err);
    res.status(500).json({ message: "Failed to load statistics" });
  }
});

/* ==============================
   PUBLIC ACTIVITY FEED
================================ */
router.get("/public/activity", auth, async (req, res) => {
  try {
    const StatusLog = require("../models/StatusLog");
    const logs = await StatusLog.find()
      .populate("disaster", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(logs);
  } catch (err) {
    console.error("Public Activity Error:", err);
    res.status(500).json({ message: "Failed to load activity feed" });
  }
});

/* ==============================
   DASHBOARD STATISTICS (ADMIN)
================================ */
router.get("/dashboard", auth, adminOnly, async (req, res) => {
  try {
    const Mission = mongoose.model("Mission");
    const AidAssignment = mongoose.model("AidAssignment");
    const GlobalStats = mongoose.model("GlobalStats");

    // Get cumulative stats
    const globalStats = await GlobalStats.getStats();

    const [
      totalUsers,
      totalVolunteers,
      totalNGOs,
      totalDisasters,
      activeDisasters,
      activeAlerts,
      totalCompletedMissions,
      totalDistributedAid,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "volunteer" }),
      NgoOrganization.countDocuments(),
      Disaster.countDocuments(), // Use live count instead of globalStats for accuracy
      Disaster.countDocuments({ status: "active" }),
      Alert.countDocuments({ status: "active" }),
      Mission.countDocuments({ status: "completed" }),
      AidAssignment.countDocuments({ status: "distributed" }),
    ]);

    res.json({
      totalUsers,
      totalVolunteers,
      totalNGOs,
      totalDisasters,
      activeDisasters,
      activeAlerts,
      totalCompletedMissions,
      totalDistributedAid,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Failed to load dashboard statistics" });
  }
});

/* ==============================
   GLOBAL ACTIVITY FEED (ADMIN)
================================ */
router.get("/activity", auth, adminOnly, async (req, res) => {
  try {
    const StatusLog = require("../models/StatusLog");
    const logs = await StatusLog.find()
      .populate("disaster", "title")
      .populate("organization", "name")
      .populate("mission", "title")
      .populate("aidAssignment", "items")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(logs);
  } catch (err) {
    console.error("Global Activity Error:", err);
    res.status(500).json({ message: "Failed to load activity feed" });
  }
});

/* ==============================
   SYNC STATISTICS (ADMIN)
================================ */
router.get("/sync", auth, adminOnly, async (req, res) => {
  try {
    const GlobalStats = mongoose.model("GlobalStats");
    const stats = await GlobalStats.syncStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error("Sync Stats Error:", err);
    res.status(500).json({ message: "Failed to sync statistics" });
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
