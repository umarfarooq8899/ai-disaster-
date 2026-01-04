const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const router = express.Router();

// Only normal users can register
router.post("/register", registerUser);

// Login for all roles
router.post("/login", loginUser);

module.exports = router;
