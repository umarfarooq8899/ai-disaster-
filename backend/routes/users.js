const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const userController = require("../controllers/userController");

// Admin: get all users
router.get("/", auth, adminOnly, userController.getAllUsers);

// Admin: change role
router.patch("/:id/role", auth, adminOnly, userController.changeRole);

// Admin: change status
router.patch("/:id/status", auth, adminOnly, userController.changeStatus);

// Admin: delete user
router.delete("/:id", auth, adminOnly, userController.deleteUser);

module.exports = router;
