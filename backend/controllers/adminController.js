const Disaster = require("../models/Disaster");
const Mission = require("../models/Mission");
const AidAssignment = require("../models/AidAssignment");
const RescueOrganization = require("../models/RescueOrganization");
const NgoOrganization = require("../models/NgoOrganization");
const User = require("../models/User");

// Verify Disaster (pending -> active)
exports.verifyDisaster = async (req, res) => {
    try {
        const disaster = await Disaster.findById(req.params.id);
        if (!disaster) return res.status(404).json({ message: "Disaster not found" });

        disaster.status = "active";
        await disaster.save();
        res.json({ message: "Disaster verified successfully", disaster });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign Rescue Mission
exports.assignRescueMission = async (req, res) => {
    const { disasterId, organizationId, title, description, skillsRequired } = req.body;

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
            status: "pending"
        });

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
            items, // Expecting array of { name: "Food", quantity: 100 } - Resource linkage might be dynamic or optional here for Admin
            notes,
            status: "assigned"
        });

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
