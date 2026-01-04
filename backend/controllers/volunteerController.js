const Volunteer = require("../models/Volunteer");

// Register volunteer
exports.registerVolunteer = async (req, res) => {
  try {
    const { phone, skills, location } = req.body;

    const volunteerExists = await Volunteer.findOne({
      user: req.user._id,
    });

    if (volunteerExists) {
      return res
        .status(400)
        .json({ message: "Already registered as volunteer" });
    }

    const volunteer = await Volunteer.create({
      user: req.user._id,
      phone,
      skills,
      location,
    });

    res.status(201).json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all volunteers (Admin)
exports.getVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find().populate(
      "user",
      "name email"
    );
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
