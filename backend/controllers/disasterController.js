const Disaster = require("../models/Disaster");

// Citizen reports disaster
exports.createDisaster = async (req, res) => {
  try {
    const { title, description, severity, latitude, longitude, address, isAI, ml_probability, confidence_score, threatZones } = req.body;

    // Construct image URL if file uploaded
    const imageUrl =
      req.files && req.files.image
        ? `/uploads/${req.files.image[0].filename}`
        : null;

    // Construct video URL if file uploaded
    const videoUrl =
      req.files && req.files.video
        ? `/uploads/${req.files.video[0].filename}`
        : null;

    if (!title || !description || !severity || !latitude || !longitude) {
      return res.status(400).json({ message: "All fields required" });
    }

    const disaster = await Disaster.create({
      title, // Frontend sends 'title', backend model has 'title' (but schema showed 'title' in prev view)
      description,
      severity,
      location: address || "Unknown Location",
      latitude,
      longitude,
      image: imageUrl,
      video: videoUrl,
      reportedBy: req.user._id,
      isAI: isAI || false,
      ml_probability: ml_probability || null,
      confidence_score: confidence_score || null,
      threatZones: threatZones || [],
    });

    res.status(201).json(disaster);
  } catch (error) {
    console.error("CREATE DISASTER ERROR:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// Get approved disasters (public)
exports.getApprovedDisasters = async (req, res) => {
  try {
    const query = { status: "active" };
    if (req.query.isAI !== undefined) {
      query.isAI = req.query.isAI === 'true';
    }
    
    const disasters = await Disaster.find(query).populate(
      "reportedBy",
      "name email"
    );

    res.json(disasters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: view all disasters
exports.getAllDisasters = async (req, res) => {
  try {
    const disasters = await Disaster.find().populate(
      "reportedBy",
      "name email role"
    );
    res.json(disasters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: approve disaster
exports.approveDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id);

    if (!disaster) {
      return res.status(404).json({ message: "Disaster not found" });
    }

    disaster.status = "active";
    await disaster.save();

    res.json({ message: "Disaster verified and activated", disaster });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: reject disaster
exports.rejectDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id);

    if (!disaster) {
      return res.status(404).json({ message: "Disaster not found" });
    }

    disaster.status = "rejected";
    await disaster.save();

    res.json({ message: "Disaster rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: resolve disaster
exports.resolveDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id);

    if (!disaster) {
      return res.status(404).json({ message: "Disaster not found" });
    }

    disaster.status = "resolved";
    await disaster.save();

    res.json({ message: "Disaster marked as resolved", disaster });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
