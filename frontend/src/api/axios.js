import axios from "axios";

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
const API_HOST = import.meta.env.VITE_API_HOST || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When sending FormData (file uploads), remove the default Content-Type
  // so the browser can auto-set it with the correct multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// Add response interceptor to convert relative image URLs to absolute and handle 401s
api.interceptors.response.use(
  (response) => {
    if (response.data?.image_url && !response.data.image_url.startsWith('http')) {
      response.data.image_url = `${API_HOST}${response.data.image_url}`;
    }
    if (response.data?.url && !response.data.url.startsWith('http')) {
      response.data.url = `${API_HOST}${response.data.url}`;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear session and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;