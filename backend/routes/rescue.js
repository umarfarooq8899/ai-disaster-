const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/auth");

const {
  getAssignedMissions,
  updateMissionStatus,
  assignVolunteersToMission,
  changeMissionStatus,
  getDashboardStats
} = require("../controllers/rescueController");

// Use existing volunteer controller for resource/volunteer data if needed, 
// or implement specific rescue endpoints. For now, we focus on the new requirements.

// Get Assigned Missions
router.get("/missions", auth, getAssignedMissions);

// Update Mission Status & Log
router.post("/updates", auth, updateMissionStatus);

// Assign Volunteers to Mission  
router.post("/missions/:missionId/assign-volunteers", auth, assignVolunteersToMission);

// Update Mission Status (for coordinators)
router.patch("/missions/:missionId/status", auth, changeMissionStatus);

// Get Dashboard Stats
router.get("/stats", auth, getDashboardStats);

// Get Recent Activity
router.get("/activity", auth, require("../controllers/rescueController").getRecentActivity);

// Get Organization Volunteers (Coordinator View)
router.get("/volunteer-management", auth, require("../controllers/volunteerController").getOrgVolunteers);

// Keep existing resource/volunteer routes for now if they are used by frontend
const Mission = require("../models/Mission");
const Resource = require("../models/Resource");
const User = require("../models/User");

// ... (Existing generic routes can stay or be refactored. 
// Given the prompt "Rescue teams only coordinate handover points", 
// and "Rescue updates: people rescued, areas cleared", the above 2 routes are key.)

// ================= GET RESOURCES (Legacy/Shared) =================
router.get("/resources", auth, async (req, res) => {
  try {
    const resources = await Resource.find().populate("organization", "name");
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

// ================= GET VOLUNTEERS (Legacy/Shared) =================
router.get("/volunteers", auth, async (req, res) => {
  try {
    const volunteers = await User.find({ role: "volunteer" }).select("name email status");
    res.json(volunteers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch volunteers" });
  }
});

module.exports = router;
