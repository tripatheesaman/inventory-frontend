import axios from "axios";
import { API_BASE_URL } from "@/constants/api";

export const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Store pending requests
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add a request interceptor
API.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is not 401 or the request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // If we're already refreshing, add this request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return API(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }
    
    originalRequest._retry = true;
    isRefreshing = true;
    
    try {
      // Call the refresh token endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      
      // Process any queued requests
      processQueue(null);
      
      // Retry the original request
      return API(originalRequest);
    } catch (refreshError) {
      // If refresh token fails, redirect to login
      processQueue(refreshError, null);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

