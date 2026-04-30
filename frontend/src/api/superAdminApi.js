import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Separate axios instance — reads from superAdminToken, not access_token
const superAdminAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

superAdminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('superAdminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

superAdminAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('SuperAdmin API error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// Auth (uses the shared /auth/login endpoint)
export const superAdminLogin = (identifier, password) =>
  axios.post(`${API_BASE_URL}/auth/login`, { identifier, password });

// Restaurants
export const listRestaurants = () =>
  superAdminAxios.get('/superadmin/restaurants');

export const createRestaurant = (data) =>
  superAdminAxios.post('/superadmin/restaurants', data);

export const toggleRestaurantActive = (clientId) =>
  superAdminAxios.patch(`/superadmin/restaurants/${clientId}/toggle-active`);
