import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
