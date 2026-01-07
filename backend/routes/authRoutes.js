const express = require("express");
const router = express.Router();

// Controllers
const { registerUser, loginUser } = require("../controllers/authController");

// ================== Routes ==================

// Register a new user
router.post("/register", registerUser);

// Login a user
router.post("/login", loginUser);

module.exports = router;
