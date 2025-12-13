import api from "./client";

export const signup = async (payload) => {
  const { data } = await api.post("/auth/signup", payload);
  return data;
};

export const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};
