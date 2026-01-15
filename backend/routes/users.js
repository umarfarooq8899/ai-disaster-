const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  changeRole,
  changeStatus,
  deleteUser,
} = require("../controllers/userController");
const { protect: auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// ROUTES
router.get("/", auth, adminOnly, getAllUsers);
router.patch("/:id/role", auth, adminOnly, changeRole);
router.patch("/:id/status", auth, adminOnly, changeStatus);
router.delete("/:id", auth, adminOnly, deleteUser);

module.exports = router;
