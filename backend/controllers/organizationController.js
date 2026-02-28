const RescueOrganization = require("../models/RescueOrganization");
const NgoOrganization = require("../models/NgoOrganization");
const User = require("../models/User");
const generateToken = require("../utils/generateToken"); // Assuming you want to return token or just user? usually just user creation

// Helper to get model by type
const getModel = (type) => {
    if (type === "rescue") return RescueOrganization;
    if (type === "ngo") return NgoOrganization;
    return null;
};

exports.getOrganizations = async (req, res) => {
    const { type } = req.params; // 'rescue' or 'ngo'
    const Model = getModel(type);

    if (!Model) {
        return res.status(400).json({ message: "Invalid organization type" });
    }

    try {
        const orgs = await Model.find().sort({ createdAt: -1 });

        // Optional: Fetch coordinators for each org to display count or names?
        // For now just return orgs, we can fetch coordinators separately or aggregate.

        // Let's aggregate coordinators count
        const orgsWithCoord = await Promise.all(orgs.map(async (org) => {
            const coordinators = await User.find({
                organization: org._id,
                role: type === 'rescue' ? 'rescue_coordinator' : 'ngo_coordinator'
            }).select('name email');
            return { ...org.toObject(), coordinators };
        }));

        res.json(orgsWithCoord);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch organizations" });
    }
};

exports.createOrganization = async (req, res) => {
    const { type } = req.params;
    const { name, location } = req.body;
    const Model = getModel(type);

    if (!Model) return res.status(400).json({ message: "Invalid type" });

    try {
        const org = await Model.create({ name, location });
        res.status(201).json(org);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Organization already exists" });
        }
        res.status(500).json({ message: "Failed to create organization" });
    }
};

exports.addCoordinator = async (req, res) => {
    const { type, id } = req.params; // org id
    const { name, email, password } = req.body;

    const role = type === "rescue" ? "rescue_coordinator" : "ngo_coordinator";

    try {
        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            organization: id,
            organizationType: type === 'rescue' ? 'RescueOrganization' : 'NgoOrganization',
            profileCompleted: true // Coordinators don't need profile steps usually
        });

        res.status(201).json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create coordinator" });
    }
};

exports.deleteOrganization = async (req, res) => {
    const { type, id } = req.params;
    const Model = getModel(type);

    if (!Model) return res.status(400).json({ message: "Invalid type" });

    try {
        const deleted = await Model.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Organization not found" });

        // Optional: Delete coordinators associated? 
        // For now, we leave them (they become orphaned or we can handle cleanup later)

        res.json({ message: "Organization deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete organization" });
    }
};
