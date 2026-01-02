const Disaster = require("../models/Disaster");

// Citizen reports disaster
exports.createDisaster = async (req, res) => {
  try {
    const { type, description, severity, location } = req.body;

    if (!type || !description || !severity || !location) {
      return res.status(400).json({ message: "All fields required" });
    }

    const disaster = await Disaster.create({
      type,
      description,
      severity,
      location,
      reportedBy: req.user._id,
    });

    res.status(201).json(disaster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get approved disasters (public)
exports.getApprovedDisasters = async (req, res) => {
  try {
    const disasters = await Disaster.find({ status: "approved" }).populate(
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

    disaster.status = "approved";
    await disaster.save();

    res.json({ message: "Disaster approved" });
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
