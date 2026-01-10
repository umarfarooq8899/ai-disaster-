const express = require("express");
const router = express.Router();
const { createVolunteer, getMyProfile } = require("../controllers/volunteerController");
const auth = require("../middleware/auth"); // make sure auth middleware is correct

// ================== Routes ==================

// Create volunteer profile (must be logged in)
router.post("/create", auth, createVolunteer);

// Get volunteer profile of logged-in user
router.get("/me", auth, getMyProfile);

module.exports = router;
