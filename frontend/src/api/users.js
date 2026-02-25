import api from "./client";

export async function getAllAlerts(userToken) {
  const { data } = await api.get("/users", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}
