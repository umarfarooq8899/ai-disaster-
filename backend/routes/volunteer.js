const express = require("express");
const router = express.Router();
const { createVolunteer, getMyProfile } = require("../controllers/volunteerController");
const { protect: auth } = require("../middleware/auth");

// Create or update volunteer profile
// Note: Frontend likely calls /create. Controller handles create/update.
router.post("/create", auth, createVolunteer);

// Get my profile
router.get("/me", auth, getMyProfile);

module.exports = router;
