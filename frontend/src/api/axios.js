import axios from "axios";

// Normalize the URL by stripping trailing slashes to prevent //api 404 errors
const apiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : "";

const instance = axios.create({
  // Use VITE_API_URL for production (Vercel), fallback to /api proxy for local development
  baseURL: apiUrl ? `${apiUrl}/api` : "/api",
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adr_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
