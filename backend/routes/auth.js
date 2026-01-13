const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ================= USER LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (user.status === "blocked") return res.status(403).json({ message: "Account is blocked" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken({ id: user._id, role: user.role });

    // Build user object safely
    let userObj = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone || null,
      address: user.address || null,
      organization: null,
    };

    // Populate organization only if exists
    if (user.organization) {
      const orgModel =
        user.role === "rescue" ? "RescueOrganization" :
        user.role === "ngo" ? "NGOOrganization" :
        "Organization"; // fallback

      const populatedOrg = await mongoose.model(orgModel).findById(user.organization).select("name").lean();
      if (populatedOrg) userObj.organization = populatedOrg;
    }

    res.json({
      token,
      user: userObj,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
