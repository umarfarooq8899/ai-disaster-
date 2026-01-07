const express = require("express");
const router = express.Router();

// Correct User model path — make sure the file is "User.js"
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ================= USER LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token with full user info (id + role)
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
