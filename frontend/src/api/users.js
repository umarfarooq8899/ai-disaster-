import api from "./client";

export async function getAllUsers(userToken) {
  const { data } = await api.get("/users", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function getNotifications(userToken) {
  const { data } = await api.get("/users/me/notifications", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function markNotificationRead(userToken, notificationId) {
  const { data } = await api.patch(`/users/me/notifications/${notificationId}/read`, {}, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function markAllNotificationsRead(userToken) {
  const { data } = await api.patch(`/users/me/notifications/mark-all-read`, {}, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function deleteNotification(userToken, notificationId) {
  const { data } = await api.delete(`/users/me/notifications/${notificationId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function clearAllNotifications(userToken) {
  const { data } = await api.delete(`/users/me/notifications/clear-all`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function getNotificationPreferences(userToken) {
  const { data } = await api.get("/users/me/notification-preferences", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function updateNotificationPreferences(userToken, preferences) {
  const { data } = await api.patch("/users/me/notification-preferences", preferences, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}
