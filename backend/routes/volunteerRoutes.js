const express = require("express");
const router = express.Router();

const {
  registerVolunteer,
  getVolunteers,
} = require("../controllers/volunteerController");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

// 🔹 Volunteer / General user can register as volunteer
router.post(
  "/register",
  protect,
  allowRoles("general", "volunteer"),
  registerVolunteer
);

// 🔹 Only admin can view all volunteers
router.get(
  "/all",
  protect,
  allowRoles("admin"),
  getVolunteers
);

module.exports = router;

