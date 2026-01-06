import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL; // set to https://restaurant-vayupos.onrender.com in Vercel

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.image_url && !response.data.image_url.startsWith("http")) {
      response.data.image_url = `${BASE_URL}${response.data.image_url}`;
    }
    if (response.data?.url && !response.data.url.startsWith("http")) {
      response.data.url = `${BASE_URL}${response.data.url}`;
    }
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
