const User = require("../models/User");
const socketManager = require("./socketManager");

/**
 * Maps notification types to user preference keys
 */
const getPrefKey = (type) => {
  if (["panic", "warning"].includes(type)) return "system";
  if (type === "success") return "disasters";
  return "missions"; // default
};

/**
 * Push a notification to a single user by ID.
 * Respects user preferences.
 */
const pushToUser = async (userId, message, type = "info") => {
  try {
    const user = await User.findById(userId).select("notificationPreferences");
    if (!user) return;

    const prefKey = getPrefKey(type);
    if (user.notificationPreferences && user.notificationPreferences[prefKey] === false) {
      return; // User disabled this category
    }

    const notification = { message, type, read: false, createdAt: new Date() };
    await User.findByIdAndUpdate(userId, { $push: { notifications: notification } });
    socketManager.emitToUser(userId, notification);
  } catch (err) {
    console.error(`[Notify] Failed to push notification to user ${userId}:`, err.message);
  }
};

/**
 * Push a notification to multiple users.
 * Filters out users who have disabled this category.
 */
const pushToUsers = async (userIds, message, type = "info") => {
  if (!userIds || userIds.length === 0) return;
  try {
    const prefKey = getPrefKey(type);
    
    // Find users who have NOT disabled this category
    const eligibleUsers = await User.find({
      _id: { $in: userIds },
      [`notificationPreferences.${prefKey}`]: { $ne: false }
    }).select("_id");

    if (eligibleUsers.length === 0) return;
    const eligibleIds = eligibleUsers.map(u => u._id);

    const notification = { message, type, read: false, createdAt: new Date() };
    await User.updateMany(
      { _id: { $in: eligibleIds } },
      { $push: { notifications: notification } }
    );
    socketManager.emitToUsers(eligibleIds, notification);
  } catch (err) {
    console.error(`[Notify] Failed to push notification to ${userIds.length} users:`, err.message);
  }
};

/**
 * Push a notification to all users with specific roles.
 * Filters by preferences.
 */
const pushToRole = async (roles, message, type = "info") => {
  try {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const prefKey = getPrefKey(type);

    const eligibleUsers = await User.find({
      role: { $in: roleArray },
      [`notificationPreferences.${prefKey}`]: { $ne: false }
    }).select("_id");

    if (eligibleUsers.length === 0) return;
    const eligibleIds = eligibleUsers.map(u => u._id);

    const notification = { message, type, read: false, createdAt: new Date() };
    await User.updateMany(
      { _id: { $in: eligibleIds } },
      { $push: { notifications: notification } }
    );
    socketManager.emitToUsers(eligibleIds, notification);
  } catch (err) {
    console.error(`[Notify] Failed to push notification to roles ${roles}:`, err.message);
  }
};

/**
 * Push a notification to ALL users in the system.
 */
const pushToAll = async (message, type = "info") => {
  try {
    const prefKey = getPrefKey(type);
    
    // Only push to users who want system/broadcasts
    const eligibleUsers = await User.find({
      [`notificationPreferences.${prefKey}`]: { $ne: false }
    }).select("_id");

    if (eligibleUsers.length === 0) return;
    const eligibleIds = eligibleUsers.map(u => u._id);

    const notification = { message, type, read: false, createdAt: new Date() };
    await User.updateMany(
      { _id: { $in: eligibleIds } },
      { $push: { notifications: notification } }
    );
    socketManager.emitToUsers(eligibleIds, notification);
  } catch (err) {
    console.error(`[Notify] Failed to push broadcast notification:`, err.message);
  }
};

module.exports = { pushToUser, pushToUsers, pushToRole, pushToAll };
