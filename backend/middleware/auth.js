// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Volunteer = require("../models/volunteer");
const RescueCoordinator = require("../models/RescueCoordinator");

module.exports = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) return res.status(401).json({ message: "Authorization token missing" });

    if (token.startsWith("Bearer ")) token = token.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch base user info
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.status === "blocked") return res.status(403).json({ message: "Account is blocked" });

    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    // If volunteer with completed profile
    if (user.role === "volunteer" && user.profileCompleted) {
      const volunteer = await Volunteer.findOne({ user: user._id })
        .populate("organization")
        .lean();

      if (!volunteer) {
        console.warn("Volunteer profile not found, returning base user");
      } else {
        userData = {
          ...userData,
          phone: volunteer.phone,
          province: volunteer.province,
          city: volunteer.city,
          skills: volunteer.skills,
          organizationType: volunteer.organizationType,
          organization: volunteer.organization || null,
          available: volunteer.available,
        };
      }
    }

    // If rescue coordinator
    if (user.role === "rescue") {
      const coordinator = await RescueCoordinator.findOne({ user: user._id })
        .populate("organization")
        .populate("user", "name email role")
        .lean();

      if (!coordinator) {
        console.warn("Rescue coordinator profile not found, returning base user");
      } else {
        userData = {
          ...userData,
          phone: coordinator.phone || null,
          address: coordinator.address || null,
          organization: coordinator.organization || null,
        };
      }
    }

    req.user = userData;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
