const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ================= USER LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password").populate("organization", "name");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Account is blocked" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        organization: user.organization || null, // <-- added for rescue coordinators
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
