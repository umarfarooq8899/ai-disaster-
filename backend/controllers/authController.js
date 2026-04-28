const User = require("../models/User");
const generateToken = require("../utils/generateToken");

/* ================= LOGIN USER ================= */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email })
      .select("+password")
      .populate("organization", "name");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Account is blocked" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        organization: user.organization || null,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

/* ================= REGISTER USER ================= */
exports.registerUser = async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      role,
      phone,
      province,
      city,
      organizationType,
      organization,
    } = req.body;

    // ❌ Prevent admin registration
    if (role === "admin") {
      return res.status(403).json({ message: "Cannot register as admin" });
    }

    // ✅ Normalize role
    if (!role) role = "general";

    // ✅ Volunteer validation (REMOVED: Handled in Step 2)
    /* 
    if (role === "volunteer") {
      if (!phone || !province || !city) {
        return res.status(400).json({
          message: "Phone number, province and city are required for this role",
        });
      }
    } 
    */

    // ❌ Duplicate email check
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // ✅ Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      province,
      city,
      organizationType,
      organization,
    });

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};
