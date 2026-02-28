// middleware/rescueOnly.js
module.exports = function (req, res, next) {
  // req.user is set by auth middleware
  if (!req.user || req.user.role !== "rescue_coordinator") {
    return res.status(403).json({ message: "Access denied: rescue coordinators only" });
  }
  next();
};
