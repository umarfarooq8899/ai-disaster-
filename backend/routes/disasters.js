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
    const { isAI } = req.query;
    const filter = { status: { $in: ["active", "resolved"] } };

    if (isAI !== undefined) {
      filter.isAI = isAI === 'true';
    }

    // Only show active or resolved disasters to the public
    const disasters = await Disaster.find(filter).sort({ createdAt: -1 });
    res.json(disasters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get MY disasters (any logged-in user — all statuses including pending/rejected)
router.get("/mine", auth, async (req, res) => {
  try {
    const disasters = await Disaster.find({ reportedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(disasters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Create AI Disaster (Admin only)
router.post("/ai", auth, adminOnly, async (req, res) => {
  try {
    const { title, description, severity, latitude, longitude, location, dangerRadius } = req.body;

    const newDisaster = new Disaster({
      title,
      description,
      location,
      latitude,
      longitude,
      severity: severity || "high",
      status: "active", // AI alerts are active immediately
      isAI: true,
      dangerRadius: dangerRadius || 10,
    });

    const saved = await newDisaster.save();
    res.status(201).json(saved);
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

    // Get assignment details for each disaster
    const disasterIds = disasters.map(d => d._id);

    const rescueAssignments = await Mission.find({ disaster: { $in: disasterIds } })
      .populate("organization", "name")
      .select("disaster organization")
      .lean();

    const ngoAssignments = await AidAssignment.find({ disaster: { $in: disasterIds } })
      .populate("ngo", "name")
      .select("disaster ngo")
      .lean();

    // Map organization names to disasters
    const rescueMap = {};
    rescueAssignments.forEach(m => {
      const dId = m.disaster.toString();
      if (!rescueMap[dId]) rescueMap[dId] = [];
      if (m.organization) rescueMap[dId].push(m.organization.name);
    });

    const ngoMap = {};
    ngoAssignments.forEach(a => {
      const dId = a.disaster.toString();
      if (!ngoMap[dId]) ngoMap[dId] = [];
      if (a.ngo) ngoMap[dId].push(a.ngo.name);
    });

    const enrichedDisasters = disasters.map(d => ({
      ...d,
      rescueMissions: rescueMap[d._id.toString()]?.length || 0,
      ngoAssignments: ngoMap[d._id.toString()]?.length || 0,
      assignedRescueOrgs: rescueMap[d._id.toString()] || [],
      assignedNgoOrgs: ngoMap[d._id.toString()] || []
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
    if (req.body.dangerRadius !== undefined) {
      disaster.dangerRadius = req.body.dangerRadius;
    }
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
    const disasterId = req.params.id;
    await Disaster.findByIdAndDelete(disasterId);
    
    const Mission = require("../models/Mission");
    const AidAssignment = require("../models/AidAssignment");
    const Alert = require("../models/Alert");
    const StatusLog = require("../models/StatusLog");

    await Mission.deleteMany({ disaster: disasterId });
    await AidAssignment.deleteMany({ disaster: disasterId });
    await Alert.deleteMany({ disaster: disasterId });
    await StatusLog.deleteMany({ disaster: disasterId });

    res.json({ message: "Disaster deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
