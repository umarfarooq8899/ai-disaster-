// middleware/ngoOnly.js
module.exports = function (req, res, next) {
    // req.user is set by auth middleware
    if (!req.user || req.user.role !== "ngo_coordinator") {
        return res.status(403).json({ message: "Access denied: NGO coordinators only" });
    }
    next();
};
