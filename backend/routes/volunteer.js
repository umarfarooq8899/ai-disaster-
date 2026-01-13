const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const { createVolunteer } = require("../controllers/volunteerController");

router.post("/create-profile", auth, createVolunteer);

module.exports = router;
