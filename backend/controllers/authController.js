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
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= REGISTER USER ================= */
exports.registerUser = async (req, res) => {
  try {
    let { name, email, password, role, phone, address } = req.body;

    // ❌ Prevent admin registration
    if (role === "admin") {
      return res.status(403).json({ message: "Cannot register as admin" });
    }

    // ✅ Normalize role from frontend
    if (role === "rescue") {
      role = "rescue_coordinator";
    }

    // ✅ Validate required extra fields
    if (
      (role === "volunteer" || role === "rescue_coordinator") &&
      (!phone || !address)
    ) {
      return res
        .status(400)
        .json({ message: "Phone number and address are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "general",
      phone,
      address,
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
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};
