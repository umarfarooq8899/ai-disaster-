const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const rescueOnly = require("../middleware/rescueOnly");

// GET all users (admin only)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude password
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// PATCH user role
router.patch("/:id/role", auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();
    res.json({ message: "Role updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update role" });
  }
});

// PATCH user status
router.patch("/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save();
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// DELETE user
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
