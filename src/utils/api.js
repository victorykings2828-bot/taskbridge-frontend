import axios from 'axios';

// In production (Vercel), VITE_API_URL must be the full backend URL
// e.g. https://taskbridge-backend-p34z.onrender.com/api
// In development, it can be /api (uses Vite proxy to localhost:5000)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let memoryAccessToken = null;
export const setAccessToken   = (token) => { memoryAccessToken = token; };
export const getAccessToken   = ()      => memoryAccessToken;
export const clearAccessToken = ()      => { memoryAccessToken = null; };

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isTokenExpired =
      error.response?.status === 401 &&
      (error.response?.data?.code === 'TOKEN_EXPIRED' ||
       error.response?.data?.message === 'Access token expired');

    if (isTokenExpired && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 }
        );
        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        window.location.replace('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
