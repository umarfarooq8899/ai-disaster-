const express = require("express");
const router = express.Router();

// Middleware
const auth = require("../middleware/auth");      // your token middleware
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

module.exports = router;
