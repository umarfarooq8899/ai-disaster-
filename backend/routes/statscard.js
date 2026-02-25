const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/auth");
const rescueOnly = require("../middleware/rescueOnly"); // or adjust role

// Example: dashboard stats
router.get("/dashboard", auth, rescueOnly, async (req, res) => {
  try {
    // Replace with real data fetching
    const stats = {
      activeVolunteers: 12,
      ongoingMissions: 4,
      activeAlerts: 3,
      resolvedMissions: 9,
    };
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
