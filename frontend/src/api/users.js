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
