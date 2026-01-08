const User = require("../models/User");
const Disaster = require("../models/Disaster");
const Alert = require("../models/Alert");

exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVolunteers = await User.countDocuments({ role: "volunteer" });
    const totalNGOs = await User.countDocuments({ role: "ngo" });

    const totalDisasters = await Disaster.countDocuments();
    const activeDisasters = await Disaster.countDocuments({ status: "active" });
    const resolvedDisasters = await Disaster.countDocuments({ status: "resolved" });

    const activeAlerts = await Alert.countDocuments({ status: "active" });

    res.json({
      totalUsers,
      totalVolunteers,
      totalNGOs,
      totalDisasters,
      activeDisasters,
      resolvedDisasters,
      activeAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};
