const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createVolunteerProfile } = require("../controllers/volunteerController");

router.post("/create-profile", auth, createVolunteerProfile);

module.exports = router;
