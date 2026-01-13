const express = require("express");
const router = express.Router();
const { createVolunteer, getMyProfile } = require("../controllers/volunteerController");
const auth = require("../middleware/auth");

// POST /api/volunteer/create → create or update volunteer profile
router.post("/create", auth, createVolunteer);

// GET /api/volunteer/me → get logged-in volunteer profile
router.get("/me", auth, getMyProfile);

module.exports = router;
