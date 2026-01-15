const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/auth");

const Mission = require("../models/Mission");
const Resource = require("../models/Resource");
const User = require("../models/User");
const RescueOrganization = require("../models/RescueOrganization");

// ================= GET ALL MISSIONS FOR COORDINATOR =================
router.get("/missions", auth, async (req, res) => {
  try {
    const missions = await Mission.find()
      .populate("organization", "name")
      .populate("assignedVolunteers", "name email")
      .populate("assignedResources", "name type quantity");
    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch missions" });
  }
});

// ================= ASSIGN VOLUNTEERS & RESOURCES =================
router.patch("/missions/:id/assign", auth, async (req, res) => {
  const { assignedVolunteers, assignedResources } = req.body;

  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    mission.assignedVolunteers = assignedVolunteers || mission.assignedVolunteers;
    mission.assignedResources = assignedResources || mission.assignedResources;

    await mission.save();

    const updatedMission = await Mission.findById(req.params.id)
      .populate("organization", "name")
      .populate("assignedVolunteers", "name email")
      .populate("assignedResources", "name type quantity");

    res.json(updatedMission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to assign resources/volunteers" });
  }
});

// ================= GET RESOURCES =================
router.get("/resources", auth, async (req, res) => {
  try {
    const resources = await Resource.find().populate("organization", "name");
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

// ================= GET VOLUNTEERS =================
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
