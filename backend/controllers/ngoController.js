const Resource = require("../models/Resource");
const AidAssignment = require("../models/AidAssignment");
const Volunteer = require("../models/Volunteer");
const Disaster = require("../models/Disaster");
const User = require("../models/User");

// Get NGO Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const orgId = req.user.organization;

        const volunteersCount = await Volunteer.countDocuments({ organization: orgId });
        const activeMissions = await AidAssignment.countDocuments({
            ngo: orgId,
            status: "assigned"
        });

        const resources = await Resource.find({ organization: orgId });
        const totalItems = resources.reduce((acc, curr) => acc + curr.quantity, 0);

        res.json({
            volunteers: volunteersCount,
            activeMissions,
            resources: totalItems
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch NGO stats" });
    }
};

// Get NGO resources
exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find({ organization: req.user.organization });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch resources" });
    }
};

// Create or update resource
exports.upsertResource = async (req, res) => {
    const { name, category, quantity, description } = req.body;
    try {
        let resource = await Resource.findOne({
            name,
            organization: req.user.organization
        });

        if (resource) {
            resource.quantity = quantity;
            resource.category = category;
            resource.description = description;
            await resource.save();
        } else {
            resource = await Resource.create({
                name,
                category,
                quantity,
                description,
                organization: req.user.organization,
                organizationType: "NgoOrganization"
            });
        }
        res.json(resource);
    } catch (err) {
        res.status(500).json({ message: "Failed to save resource" });
    }
};

// Get Aid Assignments
exports.getAidAssignments = async (req, res) => {
    try {
        const assignments = await AidAssignment.find({ ngo: req.user.organization })
            .populate("disaster", "title location")
            .populate("volunteers", "name email")
            .populate("items.resource", "name category");
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch assignments" });
    }
};

// Create Aid Assignment
exports.createAidAssignment = async (req, res) => {
    const { disasterId, items, volunteerIds, notes } = req.body;
    try {
        // Validation: check if disaster exists and is approved
        const disaster = await Disaster.findById(disasterId);
        if (!disaster || disaster.status !== "active") {
            return res.status(400).json({ message: "Disaster not found or not currently active" });
        }

        const assignment = await AidAssignment.create({
            disaster: disasterId,
            ngo: req.user.organization,
            items,
            volunteers: volunteerIds,
            notes
        });

        // Deduct quantities from Resource inventory (Simple logic for now)
        for (const item of items) {
            await Resource.findByIdAndUpdate(item.resource, {
                $inc: { quantity: -item.quantity }
            });
        }

        res.status(201).json(assignment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create aid assignment" });
    }
};

// Update status to distributed
exports.updateAidStatus = async (req, res) => {
    try {
        const assignment = await AidAssignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        assignment.status = "distributed";
        await assignment.save();
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
    }
};

// Post Status Update (Food, Medical, etc.)
exports.postStatusUpdate = async (req, res) => {
    const { assignmentId, updateType, description, metrics, images } = req.body;

    try {
        const assignment = await AidAssignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        const StatusLog = require("../models/StatusLog");
        const log = await StatusLog.create({
            disaster: assignment.disaster,
            aidAssignment: assignmentId,
            organization: req.user.organization,
            organizationType: "NgoOrganization",
            updateType,
            description,
            metrics,
            images
        });

        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ message: "Failed to post status update" });
    }
};
