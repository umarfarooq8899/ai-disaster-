const Mission = require("../models/Mission");
const StatusLog = require("../models/StatusLog");
const Disaster = require("../models/Disaster");

// Get Assigned Missions
exports.getAssignedMissions = async (req, res) => {
    try {
        const missions = await Mission.find({ organization: req.user.organization })
            .populate("disaster")
            .populate("assignedVolunteers", "name email")
            .sort({ createdAt: -1 });
        res.json(missions);
    } catch (error) {
        console.error("DEBUG: Error in getAssignedMissions:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update Mission Status & Log Activity
exports.updateMissionStatus = async (req, res) => {
    const { missionId, status, updateType, description, metrics, images } = req.body;

    try {
        const mission = await Mission.findById(missionId);
        if (!mission) return res.status(404).json({ message: "Mission not found" });

        // Update mission status if provided
        if (status) {
            await Mission.findByIdAndUpdate(missionId, { status });
        }

        // Create Status Log
        const log = await StatusLog.create({
            disaster: mission.disaster,
            mission: missionId,
            organization: req.user.organization,
            organizationType: "RescueOrganization",
            updateType, // 'rescued', 'cleared', etc.
            description,
            metrics,
            images
        });

        res.json({ message: "Status updated successfully", log });
    } catch (error) {
        console.error("DEBUG: Error in updateMissionStatus:", error);
        res.status(500).json({ message: error.message });
    }
};

// Assign Volunteers to Mission
exports.assignVolunteersToMission = async (req, res) => {
    const { missionId } = req.params;
    const { volunteerIds, taskDescription } = req.body;

    try {
        console.log(`DEBUG: assignVolunteersToMission called for mission: ${missionId}`);
        const mission = await Mission.findById(missionId);
        if (!mission) {
            console.log(`DEBUG: Mission ${missionId} not found`);
            return res.status(404).json({ message: "Mission not found" });
        }

        console.log(`DEBUG: Mission org: ${mission.organization}, User org: ${req.user.organization}`);

        // Verify mission belongs to coordinator's organization
        if (!mission.organization || !req.user.organization || mission.organization.toString() !== req.user.organization.toString()) {
            console.log("DEBUG: Authorization failed");
            return res.status(403).json({ message: "Not authorized" });
        }

        const updateData = {
            assignedVolunteers: volunteerIds,
            status: "ongoing"
        };
        if (taskDescription !== undefined) updateData.taskDescription = taskDescription;

        await Mission.findByIdAndUpdate(missionId, updateData);

        res.json({ message: "Volunteers assigned successfully", mission });
    } catch (error) {
        console.error("DEBUG: Error in assignVolunteersToMission:", error);
        res.status(500).json({ message: error.message });
    }
};

// Change Mission Status (for coordinators)
exports.changeMissionStatus = async (req, res) => {
    const { missionId } = req.params;
    const { status } = req.body;

    try {
        console.log(`DEBUG: changeMissionStatus called for mission: ${missionId} by user: ${req.user._id}`);
        const mission = await Mission.findById(missionId);
        if (!mission) {
            console.log(`DEBUG: Mission ${missionId} not found`);
            return res.status(404).json({ message: "Mission not found" });
        }

        console.log(`DEBUG: Mission org: ${mission.organization}, User org: ${req.user.organization}`);

        // Verify mission belongs to coordinator's organization
        if (!mission.organization || !req.user.organization || mission.organization.toString() !== req.user.organization.toString()) {
            console.log("DEBUG: Authorization failed");
            return res.status(403).json({ message: "Not authorized" });
        }

        await Mission.findByIdAndUpdate(missionId, { status });

        // Auto-resolve Disaster if all assignments are completed
        if (status === "completed") {
            const AidAssignment = require("../models/AidAssignment");
            const pendingMissions = await Mission.countDocuments({ disaster: mission.disaster, status: { $ne: "completed" } });
            const pendingAid = await AidAssignment.countDocuments({ disaster: mission.disaster, status: { $ne: "distributed" } });

            if (pendingMissions === 0 && pendingAid === 0) {
                const Disaster = require("../models/Disaster");
                await Disaster.findByIdAndUpdate(mission.disaster, { status: "resolved" });
                console.log(`DEBUG: Disaster ${mission.disaster} auto-resolved.`);
            }
        }

        res.json({ message: "Mission status updated", mission });
    } catch (error) {
        console.error("DEBUG: Error in changeMissionStatus:", error);
        res.status(500).json({ message: error.message });
    }
};

// Verify Proof & Complete Mission (Coordinator)
exports.verifyMission = async (req, res) => {
    const { missionId } = req.params;
    const { volunteerId } = req.body;

    try {
        console.log(`DEBUG: verifyMission called for mission: ${missionId}, volunteer: ${volunteerId} by user: ${req.user._id}`);
        const mission = await Mission.findById(missionId);
        if (!mission) {
            return res.status(404).json({ message: "Mission not found" });
        }

        // Verify mission belongs to coordinator's organization
        if (!mission.organization || !req.user.organization || mission.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (volunteerId) {
            // Verify a specific volunteer's proof
            console.log(`DEBUG: looking for volunteerId=${volunteerId} in volunteerCompletions:`, JSON.stringify(mission.volunteerCompletions.map(c => ({ id: c.volunteerId, status: c.status }))));
            let comp = mission.volunteerCompletions.find(c => c.volunteerId.toString() === volunteerId.toString());
            if (!comp) {
                return res.status(400).json({ message: `Volunteer completion record not found. Received: ${volunteerId}` });
            }
            console.log(`DEBUG: found comp status=${comp.status}`);
            if (comp.status !== "pending_verification") {
                return res.status(400).json({ message: `Volunteer is not awaiting verification (status: ${comp.status})` });
            }
            comp.status = "verified";
            await mission.save();

            // Create a status log entry (non-blocking — don't let log failure abort the response)
            const StatusLog = require("../models/StatusLog");
            StatusLog.create({
                disaster: mission.disaster,
                mission: missionId,
                organization: req.user.organization,
                organizationType: "RescueOrganization",
                updateType: "volunteer_verified",
                description: `Coordinator verified proof for a volunteer on mission "${mission.title}".`
            }).catch(e => console.error("StatusLog error (non-fatal):", e.message));

            // Check if all assigned volunteers have been verified
            const allVerified = mission.assignedVolunteers.every(id => {
                const volComp = mission.volunteerCompletions.find(c => c.volunteerId.toString() === id.toString());
                return volComp && volComp.status === "verified";
            });

            if (allVerified) {
                mission.status = "completed";
                await mission.save();

                StatusLog.create({
                    disaster: mission.disaster,
                    mission: missionId,
                    organization: req.user.organization,
                    organizationType: "RescueOrganization",
                    updateType: "mission_verified",
                    description: `All volunteer proofs verified. Mission "${mission.title}" is now fully completed.`
                }).catch(e => console.error("StatusLog error (non-fatal):", e.message));
            }

            return res.json({ message: allVerified ? "All volunteers verified! Mission completed." : "Volunteer proof verified", mission });
        } else {
            // Fallback for legacy global verification (if needed)
            if (mission.status !== "pending_verification") {
                return res.status(400).json({ message: "Mission is not awaiting verification" });
            }
            mission.status = "completed";
            await mission.save();

            const StatusLog = require("../models/StatusLog");
            await StatusLog.create({
                disaster: mission.disaster,
                mission: missionId,
                organization: req.user.organization,
                organizationType: "RescueOrganization",
                updateType: "mission_verified",
                description: `Coordinator verified volunteer proof and marked mission "${mission.title}" as completed.`
            });

            return res.json({ message: "Mission verified and marked as completed", mission });
        }
    } catch (error) {
        console.error("DEBUG: Error in verifyMission:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get stats for rescue dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const Volunteer = require("../models/Volunteer");
        const Mission = require("../models/Mission");
        const Alert = require("../models/Alert");
        const Disaster = require("../models/Disaster");
        const mongoose = require("mongoose");

        const orgId = req.user.organization;
        if (!orgId) return res.status(400).json({ message: "Organization not found for this user" });

        // Use aggregation to only count missions that are linked to an existing disaster
        // This prevents true orphan missions from inflating the stats, but allows resolved disasters.
        const missionStats = await Mission.aggregate([
            {
                $match: {
                    organization: new mongoose.Types.ObjectId(orgId),
                    status: { $in: ["ongoing", "pending", "pending_verification", "completed"] }
                }
            },
            {
                $lookup: {
                    from: "disasters",
                    localField: "disaster",
                    foreignField: "_id",
                    as: "disasterData"
                }
            },
            {
                // Only count missions where the disaster exists
                $match: {
                    "disasterData.0": { $exists: true }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map aggregation results to readable keys
        const statsMap = { ongoing: 0, pending: 0, pending_verification: 0, completed: 0 };
        missionStats.forEach(s => { statsMap[s._id] = s.count; });

        const [activeVolunteers, activeAlerts] = await Promise.all([
            Volunteer.countDocuments({ organization: orgId, available: true }),
            Alert.countDocuments({ status: "Active" })
        ]);

        res.json({
            activeVolunteers,
            ongoingMissions: statsMap.ongoing,
            pendingMissions: (statsMap.pending || 0) + (statsMap.pending_verification || 0),
            resolvedMissions: statsMap.completed,
            activeAlerts,
        });
    } catch (err) {
        console.error("DEBUG: Error in getDashboardStats:", err);
        res.status(500).json({ message: "Failed to load rescue dashboard data" });
    }
};


// Get Recent Activity for Rescue
exports.getRecentActivity = async (req, res) => {
    try {
        const StatusLog = require("../models/StatusLog");
        const logs = await StatusLog.find({
            organization: req.user.organization,
            organizationType: "RescueOrganization"
        })
            .populate("disaster", "title")
            .populate("mission", "title")
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch activity logs" });
    }
};
