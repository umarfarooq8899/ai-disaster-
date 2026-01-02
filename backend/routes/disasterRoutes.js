const express = require("express");
const {
  createDisaster,
  getApprovedDisasters,
  getAllDisasters,
} = require("../controllers/disasterController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/allowRoles");
const {
  createDisaster,
  getApprovedDisasters,
  getAllDisasters,
  approveDisaster,
  rejectDisaster,
} = require("../controllers/disasterController");

router.put(
  "/approve/:id",
  authMiddleware,
  allowRoles("admin"),
  approveDisaster
);

router.put(
  "/reject/:id",
  authMiddleware,
  allowRoles("admin"),
  rejectDisaster
);


const router = express.Router();

// Citizen
router.post("/", authMiddleware, createDisaster);

// Public (for map later)
router.get("/approved", getApprovedDisasters);

// Admin
router.get(
  "/all",
  authMiddleware,
  allowRoles("admin"),
  getAllDisasters
);

module.exports = router;
