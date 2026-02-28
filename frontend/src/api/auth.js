// src/api/auth.js
import api from "./axios";

// SIGNUP
export const signup = async (form) => {
  // ✅ Make sure the route matches your backend
  const res = await api.post("/auth/register", form); // or /signup if backend uses /signup
  return res.data;
};

// LOGIN
export const login = async (form) => {
  const res = await api.post("/auth/login", form);
  return res.data;
};
