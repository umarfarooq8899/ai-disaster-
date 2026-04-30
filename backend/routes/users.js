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
router.get("/me/notifications", auth, require("../controllers/userController").getMyNotifications);
router.patch("/me/notifications/mark-all-read", auth, require("../controllers/userController").markAllNotificationsRead);
router.delete("/me/notifications/clear-all", auth, require("../controllers/userController").clearAllNotifications);
router.patch("/me/notifications/:notificationId/read", auth, require("../controllers/userController").markNotificationRead);
router.delete("/me/notifications/:notificationId", auth, require("../controllers/userController").deleteNotification);
router.get("/me/notification-preferences", auth, require("../controllers/userController").getNotificationPreferences);
router.patch("/me/notification-preferences", auth, require("../controllers/userController").updateNotificationPreferences);
router.get("/", auth, adminOnly, getAllUsers);
router.patch("/:id/role", auth, adminOnly, changeRole);
router.patch("/:id/status", auth, adminOnly, changeStatus);
router.delete("/:id", auth, adminOnly, deleteUser);

module.exports = router;
