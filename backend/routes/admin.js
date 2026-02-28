const express = require("express");
const router = express.Router();

// Middleware
const { protect: auth } = require("../middleware/auth");      // your token middleware
const adminOnly = require("../middleware/adminOnly"); // admin-only middleware

// Models
const User = require("../models/User");    // Make sure file is User.js
const Alert = require("../models/Alert");  // Make sure file is Alert.js

// ================== USERS ROUTES ==================

// Get all users (admin only)
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update user role (admin only)
router.patch("/users/:id/role", auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update user status (admin only)
router.patch("/users/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete user (admin only)
router.delete("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================== ALERTS ROUTES ==================

// Get all alerts (admin only)
router.get("/alerts", auth, adminOnly, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update alert status (admin only)
router.patch("/alerts/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete alert (admin only)
router.delete("/alerts/:id", auth, adminOnly, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: "Alert deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================== ASSIGNMENT DETAILS ROUTES ==================

// Get missions by disaster ID (admin only)
router.get("/missions", auth, adminOnly, async (req, res) => {
  try {
    const Mission = require("../models/Mission");
    const { disaster } = req.query;

    const query = disaster ? { disaster } : {};
    const missions = await Mission.find(query)
      .populate("organization", "name")
      .populate("assignedVolunteers", "name email")
      .sort({ createdAt: -1 });

    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get aid assignments by disaster ID (admin only)
router.get("/aid-assignments", auth, adminOnly, async (req, res) => {
  try {
    const AidAssignment = require("../models/AidAssignment");
    const { disaster } = req.query;

    const query = disaster ? { disaster } : {};
    const assignments = await AidAssignment.find(query)
      .populate("ngo", "name")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get disaster audit trail (admin only)
router.get("/disasters/:disasterId/audit-trail", auth, adminOnly, async (req, res) => {
  try {
    const adminController = require("../controllers/adminController");
    await adminController.getDisasterAuditTrail(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Calculate Danger Zone Impact
router.get("/disasters/:id/impact", auth, adminOnly, async (req, res) => {
  try {
    const adminController = require("../controllers/adminController");
    await adminController.getDisasterImpact(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Broadcast Panic Alert (admin only)
router.post("/disasters/:id/broadcast", auth, adminOnly, async (req, res) => {
  try {
    const adminController = require("../controllers/adminController");
    await adminController.broadcastPanicAlert(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================== MISSION HISTORY ROUTES ==================

// Get all completed rescue missions (admin only)
router.get("/mission-history", auth, adminOnly, async (req, res) => {
  try {
    const Mission = require("../models/Mission");

    const missions = await Mission.find({ status: "completed" })
      .populate("organization", "name")
      .populate("disaster", "title location severity")
      .populate("assignedVolunteers", "name email")
      .sort({ updatedAt: -1 });

    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all distributed aid assignments (admin only)
router.get("/aid-history", auth, adminOnly, async (req, res) => {
  try {
    const AidAssignment = require("../models/AidAssignment");

    const aidHistory = await AidAssignment.find({ status: "distributed" })
      .populate("ngo", "name")
      .populate("disaster", "title location severity")
      .populate("volunteers", "name email")
      .populate("items.resource", "name category")
      .sort({ updatedAt: -1 });

    res.json(aidHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
