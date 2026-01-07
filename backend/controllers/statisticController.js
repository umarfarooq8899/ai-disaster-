const Statistic = require("../models/Statistic");

// Get all statistics (admin only)
exports.getAllStatistics = async (req, res) => {
  try {
    const stats = await Statistic.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a statistic (admin only)
exports.createStatistic = async (req, res) => {
  try {
    const { title, value } = req.body;
    if (!title || value == null) {
      return res.status(400).json({ message: "All fields required" });
    }

    const stat = new Statistic({
      title,
      value,
      createdBy: req.user._id,
    });
    await stat.save();
    res.status(201).json(stat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
