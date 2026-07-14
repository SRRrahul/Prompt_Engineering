import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Examiner API client
export const examinerApi = axios.create({ baseURL: API_URL });

examinerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('examiner_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

examinerApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('examiner_token');
      localStorage.removeItem('examiner_user');
      window.location.href = '/examiner/login';
    }
    return Promise.reject(err);
  }
);

// Admin API client
export const adminApi = axios.create({ baseURL: API_URL });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// Public API (no auth)
export const publicApi = axios.create({ baseURL: API_URL });
