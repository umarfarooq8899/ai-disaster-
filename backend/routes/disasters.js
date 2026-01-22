const express = require("express");
const router = express.Router();

// Middleware
const { protect: auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const {
  getAllRescueOrgs,
  getAllNgoOrgs,
  assignRescueMission,
  assignAidTask
} = require("../controllers/adminController");

// Model
const Disaster = require("../models/Disaster");
const upload = require("../middleware/fileUpload");

// ================== Routes ==================

// Create disaster report (any logged-in user)
router.post("/", auth, upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, severity, latitude, longitude, address, location } = req.body;

    const imagePath = req.files && req.files.image ? req.files.image[0].path.replace(/\\/g, "/") : null;
    const videoPath = req.files && req.files.video ? req.files.video[0].path.replace(/\\/g, "/") : null;

    const newDisaster = new Disaster({
      title: title,
      description: description,
      location: location || address, // Use address if location is not provided
      latitude: latitude,
      longitude: longitude,
      severity: severity,
      reportedBy: req.user.id,
      status: "pending", // Explicitly set to pending
      image: imagePath,
      video: videoPath,
    });

    const saved = await newDisaster.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all disasters (any user)
router.get("/", async (req, res) => {
  try {
    // Only show active or resolved disasters to the public
    const disasters = await Disaster.find({
      status: { $in: ["active", "resolved"] },
    }).sort({ createdAt: -1 });
    res.json(disasters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Get ALL disasters (including pending/rejected)
router.get("/admin/all", auth, adminOnly, async (req, res) => {
  try {
    const Mission = require("../models/Mission");
    const AidAssignment = require("../models/AidAssignment");

    const disasters = await Disaster.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Get assignment counts for each disaster
    const disasterIds = disasters.map(d => d._id);

    const missionCounts = await Mission.aggregate([
      { $match: { disaster: { $in: disasterIds } } },
      { $group: { _id: "$disaster", count: { $sum: 1 } } }
    ]);

    const aidCounts = await AidAssignment.aggregate([
      { $match: { disaster: { $in: disasterIds } } },
      { $group: { _id: "$disaster", count: { $sum: 1 } } }
    ]);

    // Map counts to disasters
    const missionMap = Object.fromEntries(missionCounts.map(m => [m._id.toString(), m.count]));
    const aidMap = Object.fromEntries(aidCounts.map(a => [a._id.toString(), a.count]));

    const enrichedDisasters = disasters.map(d => ({
      ...d,
      rescueMissions: missionMap[d._id.toString()] || 0,
      ngoAssignments: aidMap[d._id.toString()] || 0
    }));

    res.json(enrichedDisasters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Get all rescue orgs
router.get(
  "/orgs/rescue",
  auth,
  adminOnly,
  getAllRescueOrgs
);

// Admin: Get all NGO orgs
router.get(
  "/orgs/ngo",
  auth,
  adminOnly,
  getAllNgoOrgs
);

// Admin: assign rescue mission
router.post(
  "/assign/rescue",
  auth,
  adminOnly,
  assignRescueMission
);

// Admin: assign aid (NGO)
router.post(
  "/assign/aid",
  auth,
  adminOnly,
  assignAidTask
);

// Admin: verify disaster
router.patch("/:id/verify", auth, adminOnly, async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id);
    if (!disaster) return res.status(404).json({ message: "Disaster not found" });

    disaster.status = "active";
    await disaster.save();
    res.json(disaster);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: reject disaster
router.patch("/:id/reject", auth, adminOnly, async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id);
    if (!disaster) return res.status(404).json({ message: "Disaster not found" });

    disaster.status = "rejected";
    await disaster.save();
    res.json(disaster);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: resolve disaster
router.patch("/:id/resolve", auth, adminOnly, async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id);
    if (!disaster) return res.status(404).json({ message: "Disaster not found" });

    disaster.status = "resolved";
    await disaster.save();
    res.json(disaster);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: delete disaster
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await Disaster.findByIdAndDelete(req.params.id);
    res.json({ message: "Disaster deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
