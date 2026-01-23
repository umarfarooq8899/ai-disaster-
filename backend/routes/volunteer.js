const express = require("express");
const router = express.Router();
const { createVolunteer, getMyProfile, getMyMissions, completeMission } = require("../controllers/volunteerController");
const { protect: auth } = require("../middleware/auth");

// Create or update volunteer profile
// Note: Frontend likely calls /create. Controller handles create/update.
router.post("/create", auth, createVolunteer);

// Get my profile
router.get("/me", auth, getMyProfile);

// Get my assigned missions
router.get("/my-missions", auth, getMyMissions);

// Complete a mission
router.post("/missions/:missionId/complete", auth, completeMission);

// Get assigned tasks
router.get("/tasks", auth, require("../controllers/volunteerController").getMyTasks);

// Update task status
router.put("/tasks/:id", auth, require("../controllers/volunteerController").updateTaskStatus);

// Get dashboard stats
router.get("/stats", auth, require("../controllers/volunteerController").getDashboardStats);

// Admin: Auto-assign volunteers
router.post("/admin/auto-assign", auth, require("../controllers/volunteerController").autoAssignVolunteers);

// Toggle Availability
router.patch("/availability", auth, require("../controllers/volunteerController").toggleAvailability);

module.exports = router;
