const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const admin = await Admin.findById(decoded.id);
      if (!admin) return res.status(401).json({ message: "Unauthorized" });

      req.admin = admin;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  if (!token) return res.status(401).json({ message: "No token provided" });
};

module.exports = protectAdmin;
