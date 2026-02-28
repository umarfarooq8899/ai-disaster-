const Alert = require("../models/Alert");

// Create alert (admin)
exports.createAlert = async (req, res) => {
  try {
    const { title, message, severity, location } = req.body;

    if (!title || !message || !severity || !location) {
      return res.status(400).json({ message: "All fields required" });
    }

    const alert = await Alert.create({
      title,
      message,
      severity,
      location,
      createdBy: req.user._id,
      status: "active",
    });

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active alerts (public)
exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: "active" }).populate(
      "createdBy",
      "name email"
    );

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: update alert
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    Object.assign(alert, req.body);
    await alert.save();

    res.json({ message: "Alert updated", alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: deactivate alert
exports.deactivateAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.status = "inactive";
    await alert.save();

    res.json({ message: "Alert deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
