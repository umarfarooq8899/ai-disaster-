import api from "./client";

export async function getAllDisasters() {
  const { data } = await api.get("/statistics");
  return data;
}

export async function createDisaster(payload) {
  const { data } = await api.post("/statistics", payload);
  return data;
}