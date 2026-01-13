const Volunteer = require("../models/volunteer");
const User = require("../models/User");

// Create or update volunteer profile
exports.createVolunteer = async (req, res) => {
  const { phone, province, city, skills, organizationType, organization } = req.body;
  const userId = req.user.id;

  try {
    let volunteer = await Volunteer.findOne({ user: userId });

    if (volunteer) {
      // Update existing
      volunteer.phone = phone;
      volunteer.province = province;
      volunteer.city = city;
      volunteer.skills = skills;
      volunteer.organizationType = organizationType;
      volunteer.organization = organization;
      await volunteer.save();
    } else {
      // Create new
      volunteer = new Volunteer({
        user: userId,
        phone,
        province,
        city,
        skills,
        organizationType,
        organization,
      });
      await volunteer.save();
    }

    // Mark profile as completed in User
    await User.findByIdAndUpdate(userId, { profileCompleted: true });

    res.json({
      success: true,
      volunteer,
      message: "Volunteer profile saved successfully",
    });
  } catch (err) {
    console.error("Create Volunteer error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create volunteer profile",
    });
  }
};

// Get logged-in volunteer profile
exports.getMyProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const volunteer = await Volunteer.findOne({ user: userId })
      .populate("organization")
      .lean();

    if (!volunteer)
      return res.status(404).json({ message: "Volunteer profile not found" });

    res.json({ success: true, volunteer });
  } catch (err) {
    console.error("Get Volunteer profile error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch volunteer profile",
    });
  }
};
