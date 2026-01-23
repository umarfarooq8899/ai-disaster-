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
// Get volunteers for a specific organization (Coordinator View)
exports.getOrgVolunteers = async (req, res) => {
  try {
    const orgId = req.user.organization;
    console.log("DEBUG: getOrgVolunteers called by:", req.user._id, "Org:", orgId);

    if (!orgId) return res.status(400).json({ message: "Only organization coordinators can manage volunteers" });

    // 1. Get fully registered volunteers
    const volunteers = await Volunteer.find({ organization: orgId })
      .populate("user", "name email status")
      .populate("currentTask", "title status")
      .lean();

    console.log("DEBUG: found full volunteers:", volunteers.length);

    // 2. Get users who signed up but didn't complete profile
    // Find users with role 'volunteer' and this org, excluding those who are already in the volunteers list
    // Fixed: Handle case where v.user is null (though unlikely in prod)
    const registeredUserIds = volunteers.map(v => v.user ? v.user._id.toString() : null).filter(id => id);

    console.log("DEBUG: registered IDs:", registeredUserIds);

    const incompleteUsers = await User.find({
      organization: orgId,
      role: "volunteer",
      _id: { $nin: registeredUserIds }
    }).select("name email status").lean();

    // 3. Format incomplete users to match volunteer structure
    const pendingVolunteers = incompleteUsers.map(user => ({
      _id: "pending_" + user._id, // Temporary ID
      user: user,
      phone: "N/A",
      city: "N/A",
      skills: [],
      available: false,
      currentTask: null,
      isProfileIncomplete: true
    }));

    res.json([...volunteers, ...pendingVolunteers]);
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

// Get Missions Assigned to Volunteer
exports.getMyMissions = async (req, res) => {
  try {
    const userId = req.user.id;

    const missions = await Mission.find({ assignedVolunteers: userId })
      .populate("disaster", "title location latitude longitude severity")
      .populate("organization", "name")
      .sort({ createdAt: -1 });

    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark Mission as Complete (Volunteer)
exports.completeMission = async (req, res) => {
  const { missionId } = req.params;
  const userId = req.user.id;

  try {
    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    // Verify volunteer is assigned to this mission
    if (!mission.assignedVolunteers.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Mark as completed
    mission.status = "completed";
    await mission.save();

    res.json({ message: "Mission marked as complete", mission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Availability
exports.toggleAvailability = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user.id });
    if (!volunteer) return res.status(404).json({ message: "Volunteer profile not found" });

    volunteer.available = !volunteer.available;
    await volunteer.save();

    res.json({ success: true, available: volunteer.available, message: `Availability status updated to ${volunteer.available ? 'Active' : 'Busy'}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
