// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) return res.status(401).json({ message: "Authorization header missing" });

  if (token.startsWith("Bearer ")) token = token.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

