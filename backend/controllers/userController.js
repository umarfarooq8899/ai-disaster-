const User = require("../models/User");

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change user role (admin only)
exports.changeRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = req.body.role || user.role;
    await user.save();
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change user status (admin only)
exports.changeStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = req.body.status || user.status;
    await user.save();
    res.json({ message: "Status updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update logged-in user profile
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;

    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = req.file.path.replace(/\\/g, "/");
    }

    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update logged-in user password
exports.updateMyPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify old password
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid old password" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================== NOTIFICATIONS ==================

// Get my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Sort notifications by date descending
    const sorted = (user.notifications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await User.updateOne(
      { _id: req.user.id, "notifications._id": notificationId },
      { $set: { "notifications.$.read": true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

// Mark ALL notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { "notifications.$[].read": true } }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

// Delete a single notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await User.updateOne(
      { _id: req.user.id },
      { $pull: { notifications: { _id: notificationId } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { notifications: [] } });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
};

// ================== NOTIFICATION PREFERENCES ==================

// Get notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notificationPreferences");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.notificationPreferences || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch preferences" });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const allowed = ["disasters", "missions", "system", "roleUpdates"];
    const updates = {};
    allowed.forEach((key) => {
      if (typeof req.body[key] === "boolean") {
        updates[`notificationPreferences.${key}`] = req.body[key];
      }
    });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select("notificationPreferences");
    res.json(user.notificationPreferences);
  } catch (error) {
    res.status(500).json({ message: "Failed to update preferences" });
  }
};

