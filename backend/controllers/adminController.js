const User = require("../models/User");
const Disaster = require("../models/Disaster");
const Alert = require("../models/Alert");

/* ================= DASHBOARD ================= */
exports.getAdminStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const disasters = await Disaster.countDocuments();
    const alerts = await Alert.countDocuments();
    const volunteers = await User.countDocuments({ role: "volunteer" });

    res.json({ users, disasters, alerts, volunteers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};

/* ================= USERS ================= */
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};
exports.changeUserRole = async (req, res) => { /* unchanged */ };
exports.changeUserStatus = async (req, res) => { /* unchanged */ };
exports.deleteUser = async (req, res) => { /* unchanged */ };

/* ================= DISASTERS ================= */
exports.getAllDisasters = async (req, res) => {
  const disasters = await Disaster.find().sort({ createdAt: -1 });
  res.json(disasters);
};
exports.resolveDisaster = async (req, res) => { /* unchanged */ };
exports.deleteDisaster = async (req, res) => { /* unchanged */ };

/* ================= ALERTS ================= */
exports.getAllAlerts = async (req, res) => {
  const alerts = await Alert.find().sort({ createdAt: -1 });
  res.json(alerts);
};
exports.editAlert = async (req, res) => { /* unchanged */ };
exports.changeAlertStatus = async (req, res) => { /* unchanged */ };
exports.deleteAlert = async (req, res) => { /* unchanged */ };
