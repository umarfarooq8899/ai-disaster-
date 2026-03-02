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
    if (!mission.assignedVolunteers.some(v => v.toString() === req.user.id)) {
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
      tasksCompleted: volunteer?.tasksCompleted || 0,
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
    let feedbackMessages = [];

    // 1. Get pending tasks for this org
    if (isRescueCoordinator || (!isNgoCoordinator && isAdmin)) {
      const missionQuery = { status: "pending" };
      if (orgId) missionQuery.organization = orgId;
      const missions = await Mission.find(missionQuery).populate("disaster");
      console.log(`DEBUG: Found ${missions.length} pending Rescue missions`);
      tasksToProcess.push(...missions.map(m => ({ task: m, type: "Mission" })));
    }

    if (isNgoCoordinator || (!isRescueCoordinator && isAdmin)) {
      const aidQuery = {
        $or: [
          { status: "pending" },
          { status: "assigned", volunteers: { $size: 0 } }
        ]
      };
      if (orgId) aidQuery.ngo = orgId;
      const AidAssignment = require("../models/AidAssignment");
      const assignments = await AidAssignment.find(aidQuery).populate("disaster");
      console.log(`DEBUG: Found ${assignments.length} pending/empty-assigned NGO AidAssignments`);
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
        const msg = `Task ${task.title} skipped: No linked disaster found.`;
        console.log(`DEBUG: ${msg}`);
        feedbackMessages.push(msg);
        continue;
      }

      const { latitude: dLat, longitude: dLon } = task.disaster;

      // Validation: Check if disaster has location
      if (dLat === undefined || dLon === undefined) {
        const msg = `Task ${task.title} skipped: Disaster location missing.`;
        console.log(`DEBUG: ${msg}`);
        feedbackMessages.push(msg);
        continue;
      }

      console.log(`DEBUG: Processing task ${task._id} (${type}) at [${dLat}, ${dLon}]`);

      const volunteerQuery = {
        available: true,
        organization: (type === "Mission" ? task.organization : task.ngo)?.toString(),
      };

      // If task has no org linked (edge case), skip
      if (!volunteerQuery.organization) {
        feedbackMessages.push(`Task ${task.title} skipped: No organization linked.`);
        continue;
      }

      const candidates = await Volunteer.find(volunteerQuery);

      if (candidates.length === 0) {
        feedbackMessages.push(`Task ${task.title}: No available volunteers found in organization.`);
        continue;
      }

      // 3. Score and Sort candidates
      const scoredVolunteers = candidates.map(v => {
        // Handle missing volunteer coordinates gracefully (Infinity distance)
        const hasCoords = v.latitude !== undefined && v.longitude !== undefined;
        const distance = hasCoords ? getDistance(dLat, dLon, v.latitude, v.longitude) : Infinity;

        const skillsRequired = type === "Mission" ? (task.skillsRequired || []) : [];
        const skillMatchCount = (v.skills || []).filter(s => skillsRequired.includes(s)).length;

        return {
          volunteer: v,
          distance,
          skillMatchCount,
          hasCoords
        };
      });

      // Filter by skill match if required (Strict for Missions)
      let eligible = scoredVolunteers;
      const skillsRequired = type === "Mission" ? (task.skillsRequired || []) : [];

      if (skillsRequired.length > 0) {
        eligible = scoredVolunteers.filter(ev => ev.skillMatchCount > 0);
        const dropped = scoredVolunteers.length - eligible.length;
        if (dropped > 0) {
          console.log(`DEBUG: Dropped ${dropped} volunteers due to skill mismatch for ${task.title}`);
        }
      }

      // Sort by distance (primary) and skill match (secondary - more matches is better)
      eligible.sort((a, b) => {
        // If both have infinite distance (missing coords), sort by skill match
        if (a.distance === Infinity && b.distance === Infinity) {
          return b.skillMatchCount - a.skillMatchCount;
        }
        return a.distance - b.distance;
      });

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
        feedbackMessages.push(`Assigned ${toAssign.length} volunteers to ${task.title}.`);
      } else {
        const reason = skillsRequired.length > 0 ? "skill mismatch" : "unknown reasons";
        feedbackMessages.push(`Task ${task.title}: Found ${candidates.length} volunteers, but 0 matched ${reason}.`);
        console.log(`DEBUG: No eligible volunteers to assign to task ${task._id}`);
      }
    }

    res.json({
      success: true,
      totalAssignments,
      message: totalAssignments > 0
        ? `Successfully auto-assigned ${totalAssignments} volunteers. details: ${feedbackMessages.join(" ")}`
        : `Auto-assignment completed but no assignments made. Reasons: ${feedbackMessages.join(" ")}`
    });
  } catch (err) {
    console.error("Auto-assignment Error:", err);
    res.status(500).json({ message: "Auto-assignment failed", error: err.message });
  }
};

// Get Recommendations for a task
exports.getTaskRecommendations = async (req, res) => {
  try {
    const { taskId, type } = req.query; // type: 'Mission' or 'AidAssignment'
    if (!taskId || !type) {
      return res.status(400).json({ message: "Missing taskId or type" });
    }

    const orgId = ["rescue", "rescue_coordinator", "ngo", "ngo_coordinator"].includes(req.user.role) ? req.user.organization : null;
    let task;
    let disaster;

    if (type === "Mission") {
      const Mission = require("../models/Mission");
      task = await Mission.findById(taskId).populate("disaster");
    } else {
      const AidAssignment = require("../models/AidAssignment");
      task = await AidAssignment.findById(taskId).populate("disaster");
    }

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!task.disaster) return res.status(400).json({ message: "Task has no disaster location data" });

    disaster = task.disaster;

    // Find available volunteers in the org
    const volunteers = await Volunteer.find({
      organization: orgId,
      available: true
    }).populate("user", "name email");

    if (volunteers.length === 0) {
      return res.json([]);
    }

    const { latitude: dLat, longitude: dLon } = disaster;

    const scoredVolunteers = volunteers.map(v => {
      // Calculate distance
      const hasCoords = v.latitude !== undefined && v.longitude !== undefined;
      const distance = (hasCoords && dLat !== undefined && dLon !== undefined)
        ? parseFloat(getDistance(dLat, dLon, v.latitude, v.longitude).toFixed(2))
        : Infinity;

      // Calculate skill matches
      const skillsRequired = type === "Mission" ? (task.skillsRequired || []) : [];
      let matchScore = 0;
      let matchingSkills = [];

      if (skillsRequired.length > 0 && v.skills && v.skills.length > 0) {
        matchingSkills = v.skills.filter(s => skillsRequired.includes(s));
        // Perfect match = 100, partial = percentage
        matchScore = (matchingSkills.length / skillsRequired.length) * 100;
      } else if (skillsRequired.length === 0) {
        // If task has no requirements, everyone is a 100% skill match conceptually
        matchScore = 100;
      }

      return {
        _id: v._id,
        user: v.user, // for assignment
        name: v.name || v.user?.name,
        distance,
        matchScore,
        matchingSkills,
        skillsRequired,
        hasCoords
      };
    });

    // Sort: Score descending, then Distance ascending
    scoredVolunteers.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore; // Highest score first
      }
      return a.distance - b.distance; // Closest first
    });

    res.json(scoredVolunteers);

  } catch (error) {
    console.error("DEBUG: Error in getTaskRecommendations:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
};

// Get Missions Assigned to Volunteer
exports.getMyMissions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch Missions
    const missionsData = await Mission.find({
      assignedVolunteers: userId
    })
      .populate("disaster", "title location latitude longitude severity")
      .populate("organization", "name")
      .sort({ createdAt: -1 })
      .lean();

    const missions = missionsData.map(m => {
      const userCompletion = (m.volunteerCompletions || []).find(vc => vc.volunteerId.toString() === userId);
      let fallbackStatus = m.status;
      if (!userCompletion) {
        // Only prevent pending_verification from leaking to volunteers who haven't submitted yet.
        // Leave 'completed' as-is — old completed missions should still show as completed (history).
        if (fallbackStatus === "pending_verification") {
          fallbackStatus = "assigned";
        }
      }
      return {
        ...m,
        status: userCompletion ? userCompletion.status : fallbackStatus,
        evidenceUrls: userCompletion ? userCompletion.evidenceUrls : []
      };
    });

    // 2. Fetch Aid Assignments
    const aidAssignmentsData = await AidAssignment.find({
      volunteers: userId
    })
      .populate("disaster", "title location latitude longitude severity")
      .populate("ngo", "name")
      .sort({ createdAt: -1 })
      .lean();

    const aidAssignments = aidAssignmentsData.map(a => {
      const userCompletion = (a.volunteerCompletions || []).find(vc => vc.volunteerId.toString() === userId);
      let fallbackStatus = a.status;
      if (!userCompletion) {
        // Only block pending_verification from leaking; preserve completed/distributed as-is.
        if (fallbackStatus === "pending_verification") {
          fallbackStatus = "assigned";
        } else if (fallbackStatus === "assigned") {
          fallbackStatus = "ongoing"; // map aid 'assigned' → 'ongoing' for display
        } else if (fallbackStatus === "distributed") {
          fallbackStatus = "completed";
        }
      }
      return {
        ...a,
        status: userCompletion ? userCompletion.status : fallbackStatus,
        evidenceUrls: userCompletion ? userCompletion.evidenceUrls : []
      };
    });

    // 3. Normalize Aid Assignments to look like Missions for the frontend
    const normalizedAid = aidAssignments.map(a => ({
      _id: a._id,
      title: `Aid Delivery: ${a.disaster?.title || "Disaster Relief"}`,
      description: `Deliver items: ${a.items?.map(i => `${i.quantity} ${i.name}`).join(", ")}. Notes: ${a.notes || ""}`,
      status: a.status,
      evidenceUrls: a.evidenceUrls,
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

// Mark Mission/Task as Complete (Volunteer) — sets to pending_verification for coordinator review
exports.completeMission = async (req, res) => {
  const { missionId } = req.params;
  const userId = req.user.id;
  const { evidenceUrls } = req.body; // Array of strings (optional)

  try {
    // Try to find Mission first
    let mission = await Mission.findById(missionId);
    if (mission) {
      // Verify volunteer assignment
      if (!mission.assignedVolunteers.some(v => v.toString() === userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      // Update the specific volunteer's completion record
      let comp = mission.volunteerCompletions.find(c => c.volunteerId.toString() === userId);
      if (!comp) {
        mission.volunteerCompletions.push({
          volunteerId: userId,
          status: "pending_verification",
          evidenceUrls: evidenceUrls || [],
          submittedAt: new Date()
        });
      } else {
        comp.status = "pending_verification";
        if (evidenceUrls) comp.evidenceUrls = evidenceUrls;
        comp.submittedAt = new Date();
      }

      // Also set the global mission status to pending_verification if it's currently pending/ongoing
      // This helps the coordinator see that *some* verification is needed
      if (mission.status === "pending" || mission.status === "ongoing") {
        mission.status = "pending_verification";
      }

      await mission.save();

      // Create Status Log (non-blocking — log failure must not abort the response)
      const StatusLog = require("../models/StatusLog");
      StatusLog.create({
        disaster: mission.disaster,
        mission: mission._id,
        organization: mission.organization,
        organizationType: 'RescueOrganization',
        updateType: 'evidence_uploaded',
        description: `Volunteer ${req.user.name || 'A volunteer'} completed the task and submitted proof for coordinator verification.`,
        images: evidenceUrls || []
      }).catch(e => console.error("StatusLog error (non-fatal):", e.message));

      return res.json({ message: "Proof submitted. Awaiting coordinator verification.", mission: await Mission.findById(missionId) });
    }

    // Try AidAssignment
    const aidAssignment = await AidAssignment.findById(missionId);
    if (aidAssignment) {
      // Verify volunteer assignment
      const isAssigned = aidAssignment.volunteers.some(id => id.toString() === userId);
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Update the specific volunteer's completion record
      let comp = aidAssignment.volunteerCompletions.find(c => c.volunteerId.toString() === userId);
      if (!comp) {
        aidAssignment.volunteerCompletions.push({
          volunteerId: userId,
          status: "pending_verification",
          evidenceUrls: evidenceUrls || [],
          submittedAt: new Date()
        });
      } else {
        comp.status = "pending_verification";
        if (evidenceUrls) comp.evidenceUrls = evidenceUrls;
        comp.submittedAt = new Date();
      }

      // Also set the global aid assignment status to pending_verification if it's currently pending/assigned
      if (aidAssignment.status === "pending" || aidAssignment.status === "assigned") {
        aidAssignment.status = "pending_verification";
      }

      await aidAssignment.save();

      // Create Status Log (non-blocking)
      const StatusLog = require("../models/StatusLog");
      StatusLog.create({
        disaster: aidAssignment.disaster,
        aidAssignment: aidAssignment._id,
        organization: aidAssignment.ngo,
        organizationType: 'NgoOrganization',
        updateType: 'evidence_uploaded',
        description: `Volunteer ${req.user.name || 'A volunteer'} completed the aid task and submitted proof for NGO coordinator verification.`,
        images: evidenceUrls || []
      }).catch(e => console.error("StatusLog error (non-fatal):", e.message));

      return res.json({ message: "Proof submitted. Awaiting coordinator verification.", mission: await AidAssignment.findById(missionId) });
    }

    return res.status(404).json({ message: "Task not found" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Reject Task (Volunteer)
exports.rejectTask = async (req, res) => {
  const { missionId } = req.params;
  const userId = req.user.id;
  const { reason, type } = req.body; // type: 'Mission' or 'AidAssignment'

  try {
    let task;
    let orgId;
    let disasterId;
    let skillsRequired = [];

    // 1. Remove volunteer from task
    if (type === "Mission") {
      task = await Mission.findById(missionId).populate("disaster");
      if (!task) return res.status(404).json({ message: "Mission not found" });

      await Mission.findByIdAndUpdate(missionId, {
        $pull: { assignedVolunteers: userId }
      });
      orgId = task.organization;
      disasterId = task.disaster;
      skillsRequired = task.skillsRequired || [];

      // Update status if no volunteers left
      if (task.assignedVolunteers.length <= 1) { // 1 because we just pulled it conceptually
        await Mission.findByIdAndUpdate(missionId, { status: "pending" });
      }

    } else if (type === "AidAssignment") {
      const AidAssignment = require("../models/AidAssignment");
      task = await AidAssignment.findById(missionId).populate("disaster");
      if (!task) return res.status(404).json({ message: "Aid assignment not found" });

      await AidAssignment.findByIdAndUpdate(missionId, {
        $pull: { volunteers: userId }
      });
      orgId = task.ngo;
      disasterId = task.disaster;

      if (task.volunteers.length <= 1) {
        await AidAssignment.findByIdAndUpdate(missionId, { status: "pending" });
      }
    } else {
      return res.status(400).json({ message: "Invalid task type" });
    }

    // 2. Free up the volunteer
    const rejectingVolunteer = await Volunteer.findOneAndUpdate(
      { user: userId },
      { currentTask: null, currentTaskType: null, available: true }
    );

    // 3. Log the rejection
    const StatusLog = require("../models/StatusLog");
    await StatusLog.create({
      disaster: disasterId,
      [type === "Mission" ? "mission" : "aidAssignment"]: missionId,
      organization: orgId,
      organizationType: type === "Mission" ? 'RescueOrganization' : 'NgoOrganization',
      updateType: 'volunteer_rejected',
      description: `Volunteer ${req.user.name || 'A volunteer'} rejected the task. Reason: ${reason || 'Not specified'}.`
    });

    // 4. Trigger Auto-Reassignment for this specific task
    if (task.disaster && task.disaster.latitude !== undefined && task.disaster.longitude !== undefined) {
      console.log(`DEBUG: Triggering auto-reassignment for task ${missionId} after rejection.`);

      // Find candidates excluding the rejecting volunteer
      const candidates = await Volunteer.find({
        available: true,
        organization: orgId,
        user: { $ne: userId } // Exclude the person who just rejected it
      });

      if (candidates.length > 0) {
        const { latitude: dLat, longitude: dLon } = task.disaster;

        const scoredVolunteers = candidates.map(v => {
          const hasCoords = v.latitude !== undefined && v.longitude !== undefined;
          const distance = hasCoords ? getDistance(dLat, dLon, v.latitude, v.longitude) : Infinity;
          const skillMatchCount = (v.skills || []).filter(s => skillsRequired.includes(s)).length;

          return { volunteer: v, distance, skillMatchCount };
        });

        let eligible = scoredVolunteers;
        if (skillsRequired.length > 0) {
          eligible = scoredVolunteers.filter(ev => ev.skillMatchCount > 0);
        }

        eligible.sort((a, b) => {
          if (a.distance === Infinity && b.distance === Infinity) {
            return b.skillMatchCount - a.skillMatchCount;
          }
          return a.distance - b.distance;
        });

        // Assign top 1
        if (eligible.length > 0) {
          const replacement = eligible[0].volunteer;

          if (type === "Mission") {
            await Mission.findByIdAndUpdate(missionId, {
              $push: { assignedVolunteers: replacement.user },
              status: "ongoing"
            });
          } else {
            const AidAssignment = require("../models/AidAssignment");
            await AidAssignment.findByIdAndUpdate(missionId, {
              $push: { volunteers: replacement.user },
              status: "assigned"
            });
          }

          // Mark replacement as unavailable
          await Volunteer.findByIdAndUpdate(replacement._id, {
            available: false,
            currentTask: missionId,
            currentTaskType: type
          });

          await StatusLog.create({
            disaster: disasterId,
            [type === "Mission" ? "mission" : "aidAssignment"]: missionId,
            organization: orgId,
            organizationType: type === "Mission" ? 'RescueOrganization' : 'NgoOrganization',
            updateType: 'volunteer_assigned',
            description: `Auto-assigned replacement volunteer to ${task.title}.`
          });
          console.log(`DEBUG: Successfully auto-assigned replacement to task ${missionId}`);
        }
      }
    }

    res.json({ success: true, message: "Task rejected successfully" });

  } catch (error) {
    console.error("Reject Task Error:", error);
    res.status(500).json({ message: "Failed to reject task" });
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


