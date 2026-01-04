const express = require("express");
const router = express.Router();
const protectAdmin = require("../middleware/adminAuth");
const {
  getAdminStats,
  getAllUsers,
  changeUserRole,
  changeUserStatus,
  deleteUser,
  getAllDisasters,
  resolveDisaster,
  deleteDisaster,
  getAllAlerts,
  editAlert,
  changeAlertStatus,
  deleteAlert,
} = require("../controllers/adminController");

router.use(protectAdmin);

// Dashboard stats
router.get("/stats", getAdminStats);

// Users
router.get("/users", getAllUsers);
router.patch("/users/:id/role", changeUserRole);
router.patch("/users/:id/status", changeUserStatus);
router.delete("/users/:id", deleteUser);

// Disasters
router.get("/disasters", getAllDisasters);
router.patch("/disasters/:id/resolve", resolveDisaster);
router.delete("/disasters/:id", deleteDisaster);

// Alerts
router.get("/alerts", getAllAlerts);
router.patch("/alerts/:id", editAlert);
router.patch("/alerts/:id/status", changeAlertStatus);
router.delete("/alerts/:id", deleteAlert);

module.exports = router;
