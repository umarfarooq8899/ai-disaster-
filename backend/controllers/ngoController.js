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
            status: { $in: ["pending", "assigned"] }
        });

        const resources = await Resource.find({ organization: orgId });
        const totalItemsInStock = resources.reduce((acc, curr) => acc + curr.quantity, 0);

        const totalDistributed = await AidAssignment.countDocuments({
            ngo: orgId,
            status: "distributed"
        });

        res.json({
            volunteers: volunteersCount,
            activeMissions,
            resources: totalItemsInStock,
            totalDistributed
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch NGO stats" });
    }
};

// Get Recent Activity for NGO
exports.getRecentActivity = async (req, res) => {
    try {
        const StatusLog = require("../models/StatusLog");
        const logs = await StatusLog.find({
            organization: req.user.organization,
            organizationType: "NgoOrganization"
        })
            .populate("disaster", "title")
            .populate("aidAssignment", "items")
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch activity logs" });
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
        const assignments = await AidAssignment.find({
            ngo: req.user.organization,
            status: { $ne: "distributed" }
        })
            .populate("disaster", "title location")
            .populate("volunteers", "name email")
            .populate("items.resource", "name category")
            .lean();

        // Attach phone numbers from Volunteer model
        for (let ass of assignments) {
            if (ass.volunteers && ass.volunteers.length > 0) {
                const userIds = ass.volunteers.map(v => v._id);
                const volunteerProfiles = await Volunteer.find({ user: { $in: userIds } }).select("phone user");

                ass.volunteers = ass.volunteers.map(user => {
                    const profile = volunteerProfiles.find(p => p.user.toString() === user._id.toString());
                    return {
                        ...user,
                        phone: profile ? profile.phone : "N/A"
                    };
                });
            }
        }

        // Filter out assignments whose disaster no longer exists (orphans)
        const validAssignments = assignments.filter(a => a.disaster).map(ass => {
            // Self-healing: If status is assigned but no volunteers, treat as pending
            if (ass.status === "assigned" && (!ass.volunteers || ass.volunteers.length === 0)) {
                return { ...ass, status: "pending" };
            }
            return ass;
        });
        res.json(validAssignments);
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
            status: (volunteerIds && volunteerIds.length > 0) ? "assigned" : "pending",
            notes
        });

        // Deduct quantities from Resource inventory (Simple logic for now)
        for (const item of items) {
            await Resource.findByIdAndUpdate(item.resource, {
                $inc: { quantity: -item.quantity }
            });
        }

        // Update volunteer status if assigned
        if (volunteerIds && volunteerIds.length > 0) {
            await Volunteer.updateMany(
                { user: { $in: volunteerIds } },
                {
                    available: false,
                    currentTask: assignment._id,
                    currentTaskType: "AidAssignment"
                }
            );
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

        await AidAssignment.findByIdAndUpdate(req.params.id, { status: "distributed" });

        // Release volunteers
        if (assignment.volunteers && assignment.volunteers.length > 0) {
            await Volunteer.updateMany(
                { user: { $in: assignment.volunteers } },
                {
                    available: true,
                    currentTask: null,
                    currentTaskType: null
                }
            );
        }

        res.json(assignment);
    } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
    }
};

// Assign Volunteers to Aid Assignment
exports.assignVolunteers = async (req, res) => {
    const { volunteerIds } = req.body;
    try {
        const assignment = await AidAssignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        // Update assignment with volunteers (APPENDING new ones, ensuring uniqueness)
        // If volunteerIds is null/empty, we don't change anything unless explicit removal is intended (not covered here)
        let updatedVolunteerList = assignment.volunteers.map(v => v.toString());
        if (volunteerIds && volunteerIds.length > 0) {
            updatedVolunteerList = [...new Set([...updatedVolunteerList, ...volunteerIds])];
        }

        const updateData = { volunteers: updatedVolunteerList };

        // Update status to 'assigned' only if it's currently 'pending' and we have volunteers
        if (assignment.status === "pending" && updatedVolunteerList.length > 0) {
            updateData.status = "assigned";
        }

        const updatedAssignment = await AidAssignment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate("volunteers", "name email").lean();

        // Attach phone numbers from Volunteer model
        if (updatedAssignment.volunteers && updatedAssignment.volunteers.length > 0) {
            const userIds = updatedAssignment.volunteers.map(v => v._id);
            const volunteerProfiles = await Volunteer.find({ user: { $in: userIds } }).select("phone user");

            updatedAssignment.volunteers = updatedAssignment.volunteers.map(user => {
                const profile = volunteerProfiles.find(p => p.user.toString() === user._id.toString());
                return {
                    ...user,
                    phone: profile ? profile.phone : "N/A"
                };
            });
        }

        // Update volunteers availability
        if (volunteerIds && volunteerIds.length > 0) {
            await Volunteer.updateMany(
                { user: { $in: volunteerIds } },
                {
                    available: false,
                    currentTask: assignment._id,
                    currentTaskType: "AidAssignment"
                }
            );
        }

        res.json(updatedAssignment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to assign volunteers" });
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

// Get Aid Assignment History (Distributed only)
exports.getAidHistory = async (req, res) => {
    try {
        const history = await AidAssignment.find({
            ngo: req.user.organization,
            status: "distributed"
        })
            .populate("disaster", "title location severity")
            .populate("volunteers", "name email")
            .populate("items.resource", "name category")
            .sort({ updatedAt: -1 });

        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch aid history" });
    }
};

