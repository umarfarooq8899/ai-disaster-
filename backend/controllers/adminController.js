const User = require("../models/User");
const Disaster = require("../models/Disaster");
const Alert = require("../models/Alert");
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // 2. Find user and EXPLICITLY ask for the password field
    const user = await User.findOne({ email }).select("+password");

    // 3. Check if user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Send response
    res.json({
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(400).json({ message: error.message }); // This sends the 400 you are seeing
  }
};
// ================= USERS =================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Updated to match your User.js enum
    const validRoles = ["general", "volunteer", "ngo", "rescue", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Allowed: " + validRoles.join(", ") });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating role" });
  }
};

exports.changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

// ================= DASHBOARD =================
exports.getDashboardStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const disasters = await Disaster.countDocuments();
    const alerts = await Alert.countDocuments();
    const volunteers = await User.countDocuments({ role: "volunteer" });

    res.json({ users, disasters, alerts, volunteers });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching statistics" });
  }
};

// ================= DISASTERS =================
exports.getAllDisasters = async (req, res) => {
  try {
    const disasters = await Disaster.find().sort({ createdAt: -1 });
    res.json(disasters);
  } catch (error) {
    res.status(500).json({ message: "Error fetching disasters" });
  }
};

exports.resolveDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const disaster = await Disaster.findByIdAndUpdate(
      id, 
      { status: "Resolved" }, 
      { new: true }
    );
    if (!disaster) return res.status(404).json({ message: "Disaster not found" });
    res.json(disaster);
  } catch (error) {
    res.status(500).json({ message: "Error resolving disaster" });
  }
};

exports.deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const disaster = await Disaster.findByIdAndDelete(id);
    if (!disaster) return res.status(404).json({ message: "Disaster not found" });
    res.json({ message: "Disaster deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting disaster" });
  }
};

// ================= ALERTS =================
exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching alerts" });
  }
};

exports.editAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, target } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      id, 
      { title, type, target }, 
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: "Error updating alert" });
  }
};

exports.changeAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Active", "Disabled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const alert = await Alert.findByIdAndUpdate(id, { status }, { new: true });
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: "Error toggling alert status" });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json({ message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting alert" });
  }
};