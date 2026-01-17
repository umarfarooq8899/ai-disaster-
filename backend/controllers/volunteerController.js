const Volunteer = require("../models/Volunteer"); // Fixed case
const User = require("../models/User");
const Mission = require("../models/Mission");
const Alert = require("../models/Alert");

// Create or update volunteer profile
exports.createVolunteer = async (req, res) => {
  const { phone, province, city, skills, organizationType, organization, available } = req.body;
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
      volunteer.available = available !== undefined ? available : volunteer.available;
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
        available: available !== undefined ? available : true,
      });
      await volunteer.save();
    }

    // Mark profile as completed in User and link to the same organization
    await User.findByIdAndUpdate(userId, {
      profileCompleted: true,
      organizationType,
      organization
    });

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
      .populate("organization", "name")
      .lean();

    if (!volunteer)
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });

    res.json({ success: true, volunteer });
  } catch (err) {
    console.error("Get Volunteer profile error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch volunteer profile",
    });
  }
};

// Get assigned tasks for current volunteer
exports.getMyTasks = async (req, res) => {
  try {
    const missions = await Mission.find({
      assignedVolunteers: req.user.id,
      status: { $in: ["ongoing", "pending"] },
    }).populate("organization", "name");
    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Task not found" });

    // Ensure volunteer is assigned to this task
    if (!mission.assignedVolunteers.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    mission.status = status;
    await mission.save();

    // If completed, update volunteer availability
    if (status === "completed") {
      await Volunteer.findOneAndUpdate(
        { user: req.user.id },
        { currentTask: null, available: true }
      );
    }

    res.json({ success: true, mission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// Get stats for volunteer dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const assignedTasksCount = await Mission.countDocuments({
      assignedVolunteers: req.user.id,
      status: { $in: ["ongoing", "pending"] },
    });

    const volunteer = await Volunteer.findOne({ user: req.user.id });
    const nearbyAlertsCount = await Alert.countDocuments({
      // Simple logic: same city
      location: { $regex: volunteer?.city || "", $options: "i" },
      status: "active",
    });

    res.json({
      assignedTasks: assignedTasksCount,
      nearbyAlerts: nearbyAlertsCount,
      isAvailable: volunteer?.available || false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// Get volunteers for a specific organization (Coordinator View)
exports.getOrgVolunteers = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.status(400).json({ message: "Only organization coordinators can manage volunteers" });

    const volunteers = await Volunteer.find({ organization: orgId })
      .populate("user", "name email status")
      .populate("currentTask", "title status");

    res.json(volunteers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch organization volunteers" });
  }
};

// Auto-assignment logic (Rule-based, scoped by organization if called by coordinator)
exports.autoAssignVolunteers = async (req, res) => {
  try {
    const isCoordinator = req.user.role === "rescue_coordinator" || req.user.role === "ngo_coordinator";
    const orgId = isCoordinator ? req.user.organization : null;

    // 1. Get missions that need volunteers (scoped by org if coordinator)
    const missionQuery = { status: "pending" };
    if (orgId) missionQuery.organization = orgId;

    const missions = await Mission.find(missionQuery);

    let assignments = 0;

    for (const mission of missions) {
      // 2. Find available volunteers in the same city/province with matching skills
      // If coordinator, limit to their own volunteers
      const volunteerQuery = {
        available: true,
        city: { $regex: mission.location.split(",")[0].trim(), $options: "i" },
        skills: { $in: mission.skillsRequired || [] },
      };

      if (orgId) {
        volunteerQuery.organization = orgId;
      }

      const volunteers = await Volunteer.find(volunteerQuery).limit(5);

      if (volunteers.length > 0) {
        const volunteerUserIds = volunteers.map(v => v.user);

        mission.assignedVolunteers = [...new Set([...mission.assignedVolunteers, ...volunteerUserIds])];
        mission.status = "ongoing";
        await mission.save();

        // Update volunteer status
        await Volunteer.updateMany(
          { user: { $in: volunteerUserIds } },
          { available: false, currentTask: mission._id }
        );

        assignments += volunteers.length;
      }
    }

    res.json({ success: true, message: `Auto-assigned ${assignments} volunteers to pending missions.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Auto-assignment failed" });
  }
};
