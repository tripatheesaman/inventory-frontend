import axios from "axios";
import { API_BASE_URL } from "@/constants/api";

export const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

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
  (error) => {
    // If the error is 401, remove the token but don't redirect
    // Let the AuthContext handle the redirect logic
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Don't use window.location.href as it can cause infinite loops
      // The AuthContext will handle the redirect when it detects the token is missing
    }
    return Promise.reject(error);
  }
);

