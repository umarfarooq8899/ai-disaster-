import axios from "axios";

const api = axios.create({
  baseURL: "/api/admin",
  timeout: 5000,
});

// Add JWT token automatically to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // get token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDashboardStats = () => api.get("/stats");
export const getUsers = () => api.get("/users");
export const changeUserRole = (id, role) => api.patch(`/users/${id}/role`, { role });
export const changeUserStatus = (id, status) => api.patch(`/users/${id}/status`, { status });
export const deleteUser = (id) => api.delete(`/users/${id}`);

export const getDisasters = () => api.get("/disasters");
export const resolveDisaster = (id) => api.patch(`/disasters/${id}/resolve`, { status: "Resolved" });
export const deleteDisaster = (id) => api.delete(`/disasters/${id}`);

export const getAlerts = () => api.get("/alerts");
export const changeAlertStatus = (id, status) => api.patch(`/alerts/${id}/status`, { status });
export const deleteAlert = (id) => api.delete(`/alerts/${id}`);
export const editAlert = (id, data) => api.patch(`/alerts/${id}`, data);

export default api;
