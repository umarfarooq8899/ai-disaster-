import api from "./client";

export async function getAllDisasters(isAI) {
  const url = isAI !== undefined ? `/disasters?isAI=${isAI}` : `/disasters`;
  const { data } = await api.get(url);
  return data;
}

export async function getMyDisasters() {
  const { data } = await api.get("/disasters/mine");
  return data;
}

export async function createDisaster(payload) {
  const { data } = await api.post("/disasters", payload);
  return data;
}

export async function createAIDisaster(payload, token) {
  const { data } = await api.post("/disasters/ai", payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}
