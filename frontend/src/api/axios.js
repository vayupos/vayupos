import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
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

// Add response interceptor to convert relative image URLs to absolute
api.interceptors.response.use(
  (response) => {
    // If response contains image_url or url, convert to absolute
    if (response.data?.image_url && !response.data.image_url.startsWith('http')) {
      response.data.image_url = `http://127.0.0.1:8000${response.data.image_url}`;
    }
    if (response.data?.url && !response.data.url.startsWith('http')) {
      response.data.url = `http://127.0.0.1:8000${response.data.url}`;
    }
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;