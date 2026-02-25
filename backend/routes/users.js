const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  changeRole,
  changeStatus,
  deleteUser,
  updateMyProfile,
  updateMyPassword,
} = require("../controllers/userController");
const { protect: auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const upload = require("../middleware/fileUpload");

// ROUTES
router.patch("/me", auth, upload.single("profilePicture"), updateMyProfile);
router.patch("/me/password", auth, updateMyPassword);
router.get("/", auth, adminOnly, getAllUsers);
router.patch("/:id/role", auth, adminOnly, changeRole);
router.patch("/:id/status", auth, adminOnly, changeStatus);
router.delete("/:id", auth, adminOnly, deleteUser);

module.exports = router;
