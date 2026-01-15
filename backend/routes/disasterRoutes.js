const express = require("express");
const router = express.Router();

// Controllers
const {
  createDisaster,
  getApprovedDisasters,
  getAllDisasters,
  approveDisaster,
  rejectDisaster,
} = require("../controllers/disasterController");

// Middleware
const { protect: authMiddleware } = require("../middleware/auth");
const allowRoles = require("../middleware/allowRoles");

// ================== Routes ==================

// Create disaster report (user, volunteer, ngo)
router.post(
  "/",
  authMiddleware,
  allowRoles("user", "volunteer", "ngo"),
  createDisaster
);

// Public: get approved disasters
router.get("/approved", getApprovedDisasters);

// Admin: get all disasters
router.get(
  "/all",
  authMiddleware,
  allowRoles("admin"),
  getAllDisasters
);

// Admin: approve a disaster
router.put(
  "/approve/:id",
  authMiddleware,
  allowRoles("admin"),
  approveDisaster
);

// Admin: reject a disaster
router.put(
  "/reject/:id",
  authMiddleware,
  allowRoles("admin"),
  rejectDisaster
);

module.exports = router;
