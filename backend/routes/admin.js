const express = require("express");
const router = express.Router();

const {
  // Dashboard
  getDashboardStats,

  // Users
  getAllUsers,
  changeUserRole,
  changeUserStatus,
  deleteUser,

  // Disasters
  getAllDisasters,
  resolveDisaster,
  deleteDisaster,

  // Alerts
  getAllAlerts,
  editAlert,
  changeAlertStatus,
  deleteAlert,
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ================== DASHBOARD ==================
router.get("/stats", protect, adminOnly, getDashboardStats);

// ================== USERS ==================
router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:id/role", protect, adminOnly, changeUserRole);
router.patch("/users/:id/status", protect, adminOnly, changeUserStatus);
router.delete("/users/:id", protect, adminOnly, deleteUser);

// ================== DISASTERS ==================
router.get("/disasters", protect, adminOnly, getAllDisasters);
router.patch("/disasters/:id/resolve", protect, adminOnly, resolveDisaster);
router.delete("/disasters/:id", protect, adminOnly, deleteDisaster);

// ================== ALERTS ==================
router.get("/alerts", protect, adminOnly, getAllAlerts);
router.patch("/alerts/:id/status", protect, adminOnly, changeAlertStatus);
router.patch("/alerts/:id", protect, adminOnly, editAlert);
router.delete("/alerts/:id", protect, adminOnly, deleteAlert);

module.exports = router;
