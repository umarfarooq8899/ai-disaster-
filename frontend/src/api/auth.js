import api from "./axios";

// SIGNUP
export const signup = async (form) => {
  const res = await api.post("/auth/signup", form);
  return res.data;
};

// LOGIN
export const login = async (form) => {
  const res = await api.post("/auth/login", form);
  return res.data;
};
