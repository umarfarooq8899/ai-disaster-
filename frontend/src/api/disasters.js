import api from "./client";

export async function getAllDisasters() {
  const { data } = await api.get("/disasters");
  return data;
}

export async function createDisaster(payload) {
  const { data } = await api.post("/disasters", payload);
  return data;
}
