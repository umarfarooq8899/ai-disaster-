const Mission = require("../models/Mission");
const StatusLog = require("../models/StatusLog");
const Disaster = require("../models/Disaster");

// Get Assigned Missions
exports.getAssignedMissions = async (req, res) => {
    try {
        const missions = await Mission.find({ organization: req.user.organization })
            .populate("disaster")
            .sort({ createdAt: -1 });
        res.json(missions);
    } catch (error) {
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
            mission.status = status;
            await mission.save();
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
        res.status(500).json({ message: error.message });
    }
};

// Assign Volunteers to Mission
exports.assignVolunteersToMission = async (req, res) => {
    const { missionId } = req.params;
    const { volunteerIds } = req.body;

    try {
        const mission = await Mission.findById(missionId);
        if (!mission) return res.status(404).json({ message: "Mission not found" });

        // Verify mission belongs to coordinator's organization
        if (mission.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        mission.assignedVolunteers = volunteerIds;
        mission.status = "ongoing";
        await mission.save();

        res.json({ message: "Volunteers assigned successfully", mission });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Change Mission Status (for coordinators)
exports.changeMissionStatus = async (req, res) => {
    const { missionId } = req.params;
    const { status } = req.body;

    try {
        const mission = await Mission.findById(missionId);
        if (!mission) return res.status(404).json({ message: "Mission not found" });

        // Verify mission belongs to coordinator's organization
        if (mission.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        mission.status = status;
        await mission.save();

        res.json({ message: "Mission status updated", mission });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
