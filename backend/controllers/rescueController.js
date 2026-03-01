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
    const { volunteerIds } = req.body;

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

        await Mission.findByIdAndUpdate(missionId, {
            assignedVolunteers: volunteerIds,
            status: "ongoing"
        });

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

// Get stats for rescue dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const Volunteer = require("../models/Volunteer");
        const Mission = require("../models/Mission");
        const Alert = require("../models/Alert");

        const orgId = req.user.organization;
        if (!orgId) return res.status(400).json({ message: "Organization not found for this user" });

        const [activeVolunteers, ongoingMissions, pendingMissions, resolvedMissions, activeAlerts] = await Promise.all([
            Volunteer.countDocuments({ organization: orgId, available: true }),
            Mission.countDocuments({ organization: orgId, status: "ongoing" }),
            Mission.countDocuments({ organization: orgId, status: "pending" }),
            Mission.countDocuments({ organization: orgId, status: "completed" }),
            Alert.countDocuments({ status: "Active" })
        ]);

        res.json({
            activeVolunteers,
            ongoingMissions,
            pendingMissions,
            resolvedMissions,
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
