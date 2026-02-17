import api from "./client";

export async function getStatistics(userToken) {
  const { data } = await api.get("/statistics", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}
