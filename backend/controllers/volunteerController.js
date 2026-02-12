const Volunteer = require("../models/Volunteer"); // Fixed case
const User = require("../models/User");
const Mission = require("../models/Mission");
const Alert = require("../models/Alert");
const AidAssignment = require("../models/AidAssignment");

// Create or update volunteer profile
exports.createVolunteer = async (req, res) => {
  const { phone, province, city, skills, organizationType, organization, available, latitude, longitude } = req.body;
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
      volunteer.latitude = latitude !== undefined ? latitude : volunteer.latitude;
      volunteer.longitude = longitude !== undefined ? longitude : volunteer.longitude;
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
        latitude,
        longitude,
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

    await Mission.findByIdAndUpdate(req.params.id, { status });

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
    const assignedMissionsCount = await Mission.countDocuments({
      assignedVolunteers: req.user.id,
      status: { $in: ["ongoing", "pending"] },
    });

    const assignedAidCount = await AidAssignment.countDocuments({
      volunteers: req.user.id,
      status: { $in: ["assigned", "pending"] },
    });

    const assignedTasksCount = assignedMissionsCount + assignedAidCount;

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

// Helper to calculate distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Auto-assignment logic (Rule-based, scoped by organization if called by coordinator)
exports.autoAssignVolunteers = async (req, res) => {
  try {
    const isRescueCoordinator = ["rescue", "rescue_coordinator"].includes(req.user.role);
    const isNgoCoordinator = ["ngo", "ngo_coordinator"].includes(req.user.role);
    const isAdmin = req.user.role === "admin";
    const orgId = ["rescue", "rescue_coordinator", "ngo", "ngo_coordinator"].includes(req.user.role) ? req.user.organization : null;

    console.log(`DEBUG: autoAssignVolunteers triggered by ${req.user.role} (${req.user._id}) for org ${orgId}`);

    let totalAssignments = 0;
    let tasksToProcess = [];

    // 1. Get pending tasks for this org
    if (isRescueCoordinator || (!isNgoCoordinator && isAdmin)) {
      const missionQuery = { status: "pending" };
      if (orgId) missionQuery.organization = orgId;
      const missions = await Mission.find(missionQuery).populate("disaster");
      console.log(`DEBUG: Found ${missions.length} pending Rescue missions`);
      tasksToProcess.push(...missions.map(m => ({ task: m, type: "Mission" })));
    }

    if (isNgoCoordinator || (!isRescueCoordinator && isAdmin)) {
      const aidQuery = { status: "pending" };
      if (orgId) aidQuery.ngo = orgId;
      const AidAssignment = require("../models/AidAssignment");
      const assignments = await AidAssignment.find(aidQuery).populate("disaster");
      console.log(`DEBUG: Found ${assignments.length} pending NGO AidAssignments`);
      tasksToProcess.push(...assignments.map(a => ({ task: a, type: "AidAssignment" })));
    }

    if (tasksToProcess.length === 0) {
      return res.json({
        success: true,
        totalAssignments: 0,
        message: "No pending tasks found to assign."
      });
    }

    for (const { task, type } of tasksToProcess) {
      if (!task.disaster) {
        console.log(`DEBUG: Task ${task._id} (${type}) has no associated disaster. skipping.`);
        continue;
      }

      const { latitude: dLat, longitude: dLon } = task.disaster;
      // Fix: Check if location exists
      if (dLat === undefined || dLon === undefined) {
        console.log(`DEBUG: Task ${task._id} disaster has no coordinates (Lat: ${dLat}, Lon: ${dLon}). Skipping.`);
        continue;
      }

      console.log(`DEBUG: Processing task ${task._id} (${type}) at [${dLat}, ${dLon}]`);

      const volunteerQuery = {
        available: true,
        organization: (type === "Mission" ? task.organization : task.ngo)?.toString(),
      };

      // If task has no org linked (edge case), skip
      if (!volunteerQuery.organization) continue;

      const candidates = await Volunteer.find(volunteerQuery);

      if (candidates.length === 0) continue;

      // 3. Score and Sort candidates
      const scoredVolunteers = candidates.map(v => {
        const distance = getDistance(dLat, dLon, v.latitude, v.longitude);
        const skillsRequired = type === "Mission" ? (task.skillsRequired || []) : [];
        const skillMatchCount = (v.skills || []).filter(s => skillsRequired.includes(s)).length;

        return {
          volunteer: v,
          distance,
          skillMatchCount
        };
      });

      // Filter by skill match if required
      let eligible = scoredVolunteers;
      const skillsRequired = type === "Mission" ? (task.skillsRequired || []) : [];
      if (skillsRequired.length > 0) {
        eligible = scoredVolunteers.filter(ev => ev.skillMatchCount > 0);
        console.log(`DEBUG: Filtered to ${eligible.length} volunteers based on skill requirements`);
      }

      // Sort by distance
      eligible.sort((a, b) => a.distance - b.distance);

      // Take top 3 closest
      const toAssign = eligible.slice(0, 3).map(e => e.volunteer);

      if (toAssign.length > 0) {
        console.log(`DEBUG: Assigning ${toAssign.length} volunteers to task ${task._id}`);
        const volunteerUserIds = toAssign.map(v => v.user);

        if (type === "Mission") {
          await Mission.findByIdAndUpdate(task._id, {
            assignedVolunteers: [...new Set([...(task.assignedVolunteers || []), ...volunteerUserIds])],
            status: "ongoing"
          });
        } else {
          await AidAssignment.findByIdAndUpdate(task._id, {
            volunteers: [...new Set([...(task.volunteers || []), ...volunteerUserIds])],
            status: "assigned"
          });
        }

        // Update volunteer status
        await Volunteer.updateMany(
          { user: { $in: volunteerUserIds } },
          {
            available: false,
            currentTask: task._id,
            currentTaskType: type
          }
        );

        totalAssignments += toAssign.length;
      } else {
        console.log(`DEBUG: No eligible volunteers to assign to task ${task._id}`);
      }
    }

    res.json({
      success: true,
      totalAssignments,
      message: totalAssignments > 0
        ? `Successfully auto-assigned ${totalAssignments} volunteers based on proximity.`
        : "No available volunteers found matching criteria for pending tasks."
    });
  } catch (err) {
    console.error("Auto-assignment Error:", err);
    res.status(500).json({ message: "Auto-assignment failed" });
  }
};

// Get Missions Assigned to Volunteer
// Get Missions Assigned to Volunteer
exports.getMyMissions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch Missions
    const missions = await Mission.find({
      assignedVolunteers: userId
    })
      .populate("disaster", "title location latitude longitude severity")
      .populate("organization", "name")
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch Aid Assignments
    const aidAssignments = await AidAssignment.find({
      volunteers: userId
    })
      .populate("disaster", "title location latitude longitude severity")
      .populate("ngo", "name")
      .sort({ createdAt: -1 })
      .lean();

    // 3. Normalize Aid Assignments to look like Missions for the frontend
    const normalizedAid = aidAssignments.map(a => ({
      _id: a._id,
      title: `Aid Delivery: ${a.disaster?.title || "Disaster Relief"}`,
      description: `Deliver items: ${a.items?.map(i => `${i.quantity} ${i.name}`).join(", ")}. Notes: ${a.notes || ""}`,
      status: (a.status === "assigned" || a.status === "distributed") ? (a.status === "distributed" ? "completed" : "ongoing") : a.status, // Map 'assigned' to 'ongoing', 'distributed' to 'completed'
      disaster: a.disaster,
      location: a.disaster?.location,
      organization: a.ngo, // Use NGO as organization
      type: "AidAssignment", // Flag to distinguish if needed
      createdAt: a.createdAt
    }));

    // 4. Merge and Sort
    const allTasks = [...missions, ...normalizedAid].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allTasks);
  } catch (error) {
    console.error("Fetch missions error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark Mission as Complete (Volunteer)
// Mark Mission/Task as Complete (Volunteer)
exports.completeMission = async (req, res) => {
  const { missionId } = req.params;
  const userId = req.user.id;

  try {
    // Try to find Mission first
    let mission = await Mission.findById(missionId);
    if (mission) {
      // Verify volunteer assignment
      if (!mission.assignedVolunteers.includes(userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await Mission.findByIdAndUpdate(missionId, { status: "completed" });

      // Update volunteer availability
      await Volunteer.findOneAndUpdate(
        { user: userId },
        { currentTask: null, available: true }
      );

      return res.json({ message: "Mission marked as complete", mission });
    }

    // Try AidAssignment
    const aidAssignment = await AidAssignment.findById(missionId);
    if (aidAssignment) {
      // Verify volunteer assignment
      // AidAssignment uses 'volunteers' array of ObjectIds
      const isAssigned = aidAssignment.volunteers.some(id => id.toString() === userId);
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await AidAssignment.findByIdAndUpdate(missionId, { status: "distributed" });

      // Update volunteer availability
      await Volunteer.findOneAndUpdate(
        { user: userId },
        { currentTask: null, available: true }
      );

      return res.json({ message: "Aid assignment marked as complete", mission: aidAssignment });
    }

    return res.status(404).json({ message: "Task not found" });

  } catch (error) {
    console.error(error);
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
