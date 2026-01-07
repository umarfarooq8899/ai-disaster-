import api from "./client";

export async function getAllDisasters() {
  const { data } = await api.get("/users");
  return data;
}

export async function createDisaster(payload) {
  const { data } = await api.post("/users", payload);
  return data;
}
