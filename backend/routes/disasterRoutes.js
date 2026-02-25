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

const {
  verifyDisaster,
  assignRescueMission,
  assignAidTask,
  getAllRescueOrgs,
  getAllNgoOrgs
} = require("../controllers/adminController");

// Middleware
const { protect: authMiddleware } = require("../middleware/auth");
const allowRoles = require("../middleware/allowRoles");

// ================== Routes ==================

const upload = require("../middleware/fileUpload");

// ...

// Create disaster report (user, volunteer, ngo)
router.post(
  "/",
  authMiddleware,
  allowRoles("user", "volunteer", "ngo"),
  upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]),
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

// Admin: verify a disaster (pending -> active)
router.put(
  "/verify/:id",
  authMiddleware,
  allowRoles("admin"),
  verifyDisaster
);

// Admin: assign rescue mission
router.post(
  "/assign/rescue",
  authMiddleware,
  allowRoles("admin"),
  assignRescueMission
);

// Admin: assign aid (NGO)
router.post(
  "/assign/aid",
  authMiddleware,
  allowRoles("admin"),
  assignAidTask
);

// Admin: Get all rescue orgs
router.get(
  "/orgs/rescue",
  authMiddleware,
  allowRoles("admin"),
  getAllRescueOrgs
);

// Admin: Get all NGO orgs
router.get(
  "/orgs/ngo",
  authMiddleware,
  allowRoles("admin"),
  getAllNgoOrgs
);

module.exports = router;
