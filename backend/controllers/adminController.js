const Disaster = require("../models/Disaster");
const Mission = require("../models/Mission");
const AidAssignment = require("../models/AidAssignment");
const RescueOrganization = require("../models/RescueOrganization");
const NgoOrganization = require("../models/NgoOrganization");
const User = require("../models/User");
const { pushToUser, pushToUsers, pushToRole } = require("../utils/notifyUsers");

// Verify Disaster (pending -> active)
exports.verifyDisaster = async (req, res) => {
    try {
        const { dangerRadius } = req.body;
        const disaster = await Disaster.findById(req.params.id);
        if (!disaster) return res.status(404).json({ message: "Disaster not found" });

        disaster.status = "active";
        if (dangerRadius) disaster.dangerRadius = dangerRadius;

        await disaster.save();

        // Notify the reporter their disaster was verified
        if (disaster.reportedBy) {
            pushToUser(
                disaster.reportedBy,
                `✅ Your disaster report "${disaster.title}" has been verified and is now active.`,
                "success"
            );
        }

        res.json({ message: "Disaster verified successfully", disaster });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign Rescue Mission
exports.assignRescueMission = async (req, res) => {
    const { disasterId, organizationId, title, description, skillsRequired, volunteersRequired, ambulancesRequired, firefightersRequired } = req.body;

    try {
        const disaster = await Disaster.findById(disasterId);
        if (!disaster || disaster.status !== "active") {
            return res.status(400).json({ message: "Disaster not found or not active" });
        }

        const mission = await Mission.create({
            title,
            description,
            location: disaster.location,
            organization: organizationId,
            disaster: disasterId,
            skillsRequired,
            volunteersRequired: volunteersRequired || 0,
            ambulancesRequired: ambulancesRequired || 0,
            firefightersRequired: firefightersRequired || 0,
            status: "pending"
        });

        // Notify all rescue coordinators in the assigned organization
        const rescueCoords = await User.find({
            organization: organizationId,
            role: { $in: ["rescue", "rescue_coordinator"] }
        }).select("_id");
        const coordIds = rescueCoords.map(u => u._id);
        if (coordIds.length > 0) {
            pushToUsers(
                coordIds,
                `🚨 New rescue mission assigned: "${title}" for disaster "${disaster.title}" at ${disaster.location}.`,
                "warning"
            );
        }

        res.status(201).json(mission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign NGO Aid Task
exports.assignAidTask = async (req, res) => {
    const { disasterId, organizationId, items, notes } = req.body;

    try {
        const disaster = await Disaster.findById(disasterId);
        if (!disaster || disaster.status !== "active") {
            return res.status(400).json({ message: "Disaster not found or not active" });
        }

        const assignment = await AidAssignment.create({
            disaster: disasterId,
            ngo: organizationId,
            items,
            notes,
            status: "assigned"
        });

        // Notify all NGO coordinators in the assigned organization
        const ngoCoords = await User.find({
            organization: organizationId,
            role: { $in: ["ngo", "ngo_coordinator"] }
        }).select("_id");
        const coordIds = ngoCoords.map(u => u._id);
        if (coordIds.length > 0) {
            pushToUsers(
                coordIds,
                `📦 New aid assignment for disaster "${disaster.title}" at ${disaster.location}. Please review and deploy resources.`,
                "info"
            );
        }

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Rescue Organizations
exports.getAllRescueOrgs = async (req, res) => {
    try {
        const orgs = await RescueOrganization.find();
        res.json(orgs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All NLP Organizations
exports.getAllNgoOrgs = async (req, res) => {
    try {
        const orgs = await NgoOrganization.find();
        res.json(orgs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Disaster Audit Trail (Status Logs)
exports.getDisasterAuditTrail = async (req, res) => {
    try {
        const { disasterId } = req.params;
        const StatusLog = require("../models/StatusLog");

        // Fetch logs for this disaster and populate organization details
        const logs = await StatusLog.find({ disaster: disasterId })
            .populate("organization", "name location")
            .populate("mission", "title")
            .populate("aidAssignment", "items")
            .sort({ createdAt: -1 }); // Newest first

        res.json(logs);
    } catch (error) {
        console.error("Error fetching audit trail:", error);
        res.status(500).json({ message: "Failed to fetch audit trail" });
    }
};

// Calculate Impact (People within danger radius)
exports.getDisasterImpact = async (req, res) => {
    try {
        const { id } = req.params;
        const disaster = await Disaster.findById(id);

        if (!disaster) {
            return res.status(404).json({ message: "Disaster not found" });
        }

        if (!disaster.latitude || !disaster.longitude) {
            return res.json({ citizensInDanger: 0, volunteersNearby: 0 });
        }

        const radiusInKm = disaster.dangerRadius || 5;

        // Haversine formula logic translated to MongoDB aggregation or simple fetch and filter
        // For simplicity and to avoid complex geo-indexes if not already set up, we'll fetch users with coords and filter

        const User = require("../models/User");
        const Volunteer = require("../models/Volunteer");

        // Fetch all users with coordinates
        const allUsers = await User.find({ latitude: { $exists: true }, longitude: { $exists: true } });

        let citizensInDanger = 0;
        let volunteersNearby = 0;

        const toRad = (value) => (value * Math.PI) / 180;

        allUsers.forEach(user => {
            const R = 6371; // Earth's radius in km
            const dLat = toRad(user.latitude - disaster.latitude);
            const dLon = toRad(user.longitude - disaster.longitude);
            const lat1 = toRad(disaster.latitude);
            const lat2 = toRad(user.latitude);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance <= radiusInKm) {
                if (user.role === 'user') citizensInDanger++;
                if (user.role === 'volunteer') volunteersNearby++;
            }
        });

        res.json({
            radiusInKm,
            citizensInDanger,
            volunteersNearby,
            totalImpacted: citizensInDanger + volunteersNearby
        });

    } catch (error) {
        console.error("Error calculating impact:", error);
        res.status(500).json({ message: "Failed to calculate impact" });
    }
};

// Broadcast Panic Alert to impacted users
exports.broadcastPanicAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const disaster = await Disaster.findById(id);

        if (!disaster) {
            return res.status(404).json({ message: "Disaster not found" });
        }

        if (!disaster.latitude || !disaster.longitude) {
            return res.status(400).json({ message: "Disaster has no coordinate data. Cannot broadcast." });
        }

        const radiusInKm = disaster.dangerRadius || 5;
        const User = require("../models/User");

        // Fetch all users with coordinates
        const allUsers = await User.find({ latitude: { $exists: true }, longitude: { $exists: true } });

        const toRad = (value) => (value * Math.PI) / 180;
        let affectedUserIds = [];

        allUsers.forEach(user => {
            const R = 6371; // Earth's radius in km
            const dLat = toRad(user.latitude - disaster.latitude);
            const dLon = toRad(user.longitude - disaster.longitude);
            const lat1 = toRad(disaster.latitude);
            const lat2 = toRad(user.latitude);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance <= radiusInKm) {
                affectedUserIds.push(user._id);
            }
        });

        if (affectedUserIds.length === 0) {
            return res.json({ message: "No users found in the danger zone.", count: 0 });
        }

        // Create the notification object
        const notification = {
            message: `🚨 PANIC ALERT: You are within the danger zone (${radiusInKm}km) for ${disaster.title}. Please seek safety immediately.`,
            type: "panic"
        };

        // Bulk update users to push notification
        await User.updateMany(
            { _id: { $in: affectedUserIds } },
            { $push: { notifications: notification } }
        );

        // Optionally, create a StatusLog for the audit trail
        const StatusLog = require("../models/StatusLog");
        await StatusLog.create({
            disaster: disaster._id,
            updateType: 'admin_broadcast',
            description: `A panic alert was broadcasted to ${affectedUserIds.length} users within the ${radiusInKm}km danger zone.`,
        });

        res.json({ success: true, message: `Alert broadcasted successfully to ${affectedUserIds.length} users.`, count: affectedUserIds.length });

    } catch (error) {
        console.error("Error broadcasting alert:", error);
        res.status(500).json({ message: "Failed to broadcast alert" });
    }
};
