const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth"); // Assuming auth middleware exists
const { getOrganizations, createOrganization, addCoordinator } = require("../controllers/organizationController");

// Base path: /api/organizations

// Get all orgs by type (rescue/ngo)
router.get("/:type", protect, admin, getOrganizations);

// Create new org
router.post("/:type", protect, admin, createOrganization);

// Add coordinator to org
router.post("/:type/:id/coordinators", protect, admin, addCoordinator);

module.exports = router;
