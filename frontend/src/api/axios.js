import axios from "axios";

const instance = axios.create({
  // Vercel proxies /api/* to Railway backend (see vercel.json)
  // This works for both local dev (via vite proxy) and production (via Vercel rewrite)
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`
    : "/api",
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
