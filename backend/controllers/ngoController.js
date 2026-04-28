const Resource = require("../models/Resource");
const AidAssignment = require("../models/AidAssignment");
const Volunteer = require("../models/Volunteer");
const Disaster = require("../models/Disaster");
const User = require("../models/User");
const mongoose = require("mongoose");

// Get NGO Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const orgId = req.user.organization;

        const volunteersCount = await Volunteer.countDocuments({ organization: orgId });

        // Count active missions while ensuring disaster still exists (avoiding orphans)
        const activeMissionsResult = await AidAssignment.aggregate([
            {
                $match: {
                    ngo: new mongoose.Types.ObjectId(orgId),
                    status: { $in: ["pending", "assigned", "pending_verification"] }
                }
            },
            {
                $lookup: {
                    from: "disasters", // Collection name in MongoDB
                    localField: "disaster",
                    foreignField: "_id",
                    as: "disasterData"
                }
            },
            {
                $match: {
                    "disasterData.0": { $exists: true }
                }
            },
            {
                $count: "count"
            }
        ]);

        const activeMissions = activeMissionsResult.length > 0 ? activeMissionsResult[0].count : 0;

        const resources = await Resource.find({ organization: orgId });
        const totalItemsInStock = resources.reduce((acc, curr) => acc + curr.quantity, 0);

        // Calculate total distributed items (sum of quantities from completed/distributed assignments)
        const distributedAssignments = await AidAssignment.find({
            ngo: orgId,
            status: { $in: ["distributed", "completed"] }
        });
        
        const totalDistributed = distributedAssignments.reduce((acc, assignment) => {
            const assignmentTotal = assignment.items.reduce((sum, item) => sum + item.quantity, 0);
            return acc + assignmentTotal;
        }, 0);

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
            status: { $in: ["pending", "assigned", "pending_verification"] }
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
    
    // Start a Mongoose session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validation: check if disaster exists and is approved
        const disaster = await Disaster.findById(disasterId).session(session);
        if (!disaster || disaster.status !== "active") {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Disaster not found or not currently active" });
        }

        const assignment = await AidAssignment.create([{
            disaster: disasterId,
            ngo: req.user.organization,
            items,
            volunteers: volunteerIds,
            status: (volunteerIds && volunteerIds.length > 0) ? "assigned" : "pending",
            notes
        }], { session });

        // Deduct quantities from Resource inventory
        for (const item of items) {
            const resource = await Resource.findById(item.resource).session(session);
            if (!resource || resource.quantity < item.quantity) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Insufficient stock for resource: ${item.name}` });
            }
            resource.quantity -= item.quantity;
            await resource.save({ session });
        }

        // Update volunteer status if assigned
        if (volunteerIds && volunteerIds.length > 0) {
            await Volunteer.updateMany(
                { user: { $in: volunteerIds } },
                {
                    available: false,
                    currentTask: assignment[0]._id,
                    currentTaskType: "AidAssignment"
                },
                { session }
            );
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json(assignment[0]);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("DEBUG: Transaction failed in createAidAssignment", err);
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

        // Auto-resolve Disaster if all assignments are completed
        const Mission = require("../models/Mission");
        const pendingMissions = await Mission.countDocuments({ disaster: assignment.disaster, status: { $ne: "completed" } });
        const pendingAid = await AidAssignment.countDocuments({ disaster: assignment.disaster, status: { $ne: "distributed" } });

        if (pendingMissions === 0 && pendingAid === 0) {
            const Disaster = require("../models/Disaster");
            await Disaster.findByIdAndUpdate(assignment.disaster, { status: "resolved" });
            console.log(`DEBUG: Disaster ${assignment.disaster} auto-resolved.`);
        }

        res.json(assignment);
    } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
    }
};

// Assign Volunteers to Aid Assignment
exports.assignVolunteers = async (req, res) => {
    const { volunteerIds, taskDescription } = req.body;
    try {
        const assignment = await AidAssignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        // Update assignment with volunteers (APPENDING new ones, ensuring uniqueness)
        let updatedVolunteerList = assignment.volunteers.map(v => v.toString());
        if (volunteerIds && volunteerIds.length > 0) {
            updatedVolunteerList = [...new Set([...updatedVolunteerList, ...volunteerIds])];
        }

        const updateData = { volunteers: updatedVolunteerList };
        if (taskDescription !== undefined) updateData.taskDescription = taskDescription;

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

// Verify Proof & Complete Aid Assignment (NGO Coordinator)
exports.verifyAidAssignment = async (req, res) => {
    const { volunteerId } = req.body;

    try {
        const assignment = await AidAssignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        // Verify assignment belongs to coordinator's NGO
        if (!req.user.organization || assignment.ngo.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (volunteerId) {
            // Verify a specific volunteer's proof
            let comp = assignment.volunteerCompletions.find(c => c.volunteerId.toString() === volunteerId);
            if (!comp) {
                return res.status(400).json({ message: "Volunteer completion record not found" });
            }
            if (comp.status !== "pending_verification") {
                return res.status(400).json({ message: "Volunteer is not awaiting verification" });
            }
            comp.status = "verified";
            await assignment.save();

            // Release the specific volunteer
            await Volunteer.findOneAndUpdate(
                { user: volunteerId },
                { available: true, currentTask: null, currentTaskType: null }
            );

            // Create a status log entry (non-blocking)
            const StatusLog = require("../models/StatusLog");
            StatusLog.create({
                disaster: assignment.disaster,
                aidAssignment: assignment._id,
                organization: req.user.organization,
                organizationType: "NgoOrganization",
                updateType: "volunteer_verified",
                description: `NGO coordinator verified proof for a volunteer.`
            }).catch(e => console.error("StatusLog error (non-fatal):", e.message));

            // Check if all assigned volunteers have been verified
            const allVerified = assignment.volunteers.every(id => {
                const volComp = assignment.volunteerCompletions.find(c => c.volunteerId.toString() === id.toString());
                return volComp && volComp.status === "verified";
            });

            if (allVerified) {
                assignment.status = "completed";
                await assignment.save();

                StatusLog.create({
                    disaster: assignment.disaster,
                    aidAssignment: assignment._id,
                    organization: req.user.organization,
                    organizationType: "NgoOrganization",
                    updateType: "aid_verified",
                    description: `All volunteer proofs verified. Aid assignment is now fully completed.`
                }).catch(e => console.error("StatusLog error (non-fatal):", e.message));
            }

            return res.json({ message: allVerified ? "All volunteers verified! Aid assignment completed." : "Volunteer proof verified", assignment });
        } else {
            // Fallback for legacy global verification (if needed)
            if (assignment.status !== "pending_verification") {
                return res.status(400).json({ message: "Assignment is not awaiting verification" });
            }

            await AidAssignment.findByIdAndUpdate(req.params.id, { status: "completed" });

            // Release volunteers
            if (assignment.volunteers && assignment.volunteers.length > 0) {
                await Volunteer.updateMany(
                    { user: { $in: assignment.volunteers } },
                    { available: true, currentTask: null, currentTaskType: null }
                );
            }

            // Create a status log entry (non-blocking)
            const StatusLog = require("../models/StatusLog");
            StatusLog.create({
                disaster: assignment.disaster,
                aidAssignment: assignment._id,
                organization: req.user.organization,
                organizationType: "NgoOrganization",
                updateType: "aid_verified",
                description: `NGO coordinator verified volunteer proof and marked aid assignment as completed.`
            }).catch(e => console.error("StatusLog error (non-fatal):", e.message));

            return res.json({ message: "Aid assignment verified and marked as completed" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to verify aid assignment" });
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
            status: { $in: ["distributed", "completed"] }
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

