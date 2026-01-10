const Volunteer = require("../models/Volunteer");
const User = require("../models/User");

/**
 * Create a new volunteer profile
 * Required: userId, phone, location (lat,lng), skills (optional)
 */
exports.createVolunteer = async (req, res) => {
  try {
    const { phone, skills = [], location } = req.body;
    const userId = req.user._id; // user must be logged in

    // Validate required fields
    if (!phone || !location?.lat || !location?.lng) {
      return res.status(400).json({ message: "Phone number and location are required" });
    }

    // Check if volunteer profile already exists
    const existing = await Volunteer.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({ message: "Volunteer profile already exists" });
    }

    // Create volunteer
    const volunteer = await Volunteer.create({
      user: userId,
      phone,
      skills,
      location,
    });

    res.status(201).json({
      success: true,
      volunteer,
    });
  } catch (err) {
    console.error("Volunteer creation error:", err);
    res.status(500).json({ message: "Failed to create volunteer profile" });
  }
};

/**
 * Get volunteer profile of logged-in user
 */
exports.getMyProfile = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user._id }).populate("user", "name email role");
    if (!volunteer) return res.status(404).json({ message: "Volunteer profile not found" });

    res.json({ success: true, volunteer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch volunteer profile" });
  }
};
