const express = require("express");
const router = express.Router();

// Middleware
const { protect: auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Model
const Disaster = require("../models/Disaster");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// ================== Routes ==================

// Create disaster report (any logged-in user)
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, severity, latitude, longitude, address, location } = req.body;

    const newDisaster = new Disaster({
      title: title,
      description: description,
      location: location || address, // Use address if location is not provided
      latitude: latitude,
      longitude: longitude,
      severity: severity,
      reportedBy: req.user.id,
      status: "pending", // Explicitly set to pending
      image: req.file ? req.file.path.replace(/\\/g, "/") : null,
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
    const disasters = await Disaster.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(disasters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

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
