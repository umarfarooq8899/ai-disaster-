// src/api/admin.js
import axios from "./axios"; // your preconfigured axios instance

// Attach admin JWT token automatically
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("adr_token"); // use consistent token key
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===== Dashboard =====
export const getDashboardStats = () => axios.get("/admin/stats");

// ===== Users =====
export const getUsers = () => axios.get("/admin/users");
export const changeUserRole = (id, role) =>
  axios.patch(`/admin/users/${id}/role`, { role });
export const changeUserStatus = (id, status) =>
  axios.patch(`/admin/users/${id}/status`, { status });
export const deleteUser = (id) => axios.delete(`/admin/users/${id}`);

// ===== Disasters =====
export const getDisasters = () => axios.get("/admin/disasters");
export const resolveDisaster = (id) =>
  axios.patch(`/admin/disasters/${id}/resolve`);
export const deleteDisaster = (id) => axios.delete(`/admin/disasters/${id}`);

// ===== Alerts =====
export const getAlerts = () => axios.get("/admin/alerts");
export const editAlert = (id, data) => axios.patch(`/admin/alerts/${id}`, data);
export const changeAlertStatus = (id, status) =>
  axios.patch(`/admin/alerts/${id}/status`, { status });
export const deleteAlert = (id) => axios.delete(`/admin/alerts/${id}`);
