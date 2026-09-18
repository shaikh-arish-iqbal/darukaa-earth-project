/**
 * API Service Layer
 * =================
 * All HTTP requests to the backend go through this file.
 * This keeps the API URL in one place and automatically attaches the JWT token.
 *
 * The base URL is read from the environment variable VITE_API_URL.
 * In development: http://localhost:8000
 * In production: your Render.com backend URL
 */

import axios from "axios";
import { getToken, removeToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if the server returns 401, the token is expired/invalid
// Log the user out automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (name, email, password) => api.post("/auth/register", { name, email, password }),

  login: (email, password) => api.post("/auth/login", { email, password }),

  me: () => api.get("/auth/me"),
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get("/projects"),

  create: (name, description) => api.post("/projects", { name, description }),

  get: (id) => api.get(`/projects/${id}`),

  delete: (id) => api.delete(`/projects/${id}`),
};

// ── Sites ──────────────────────────────────────────────────────────────────────

export const sitesApi = {
  list: (projectId) => api.get(`/projects/${projectId}/sites`),

  create: (projectId, name, description, geometry) =>
    api.post(`/projects/${projectId}/sites`, { name, description, geometry }),

  get: (siteId) => api.get(`/sites/${siteId}`),

  getAnalytics: (siteId) => api.get(`/sites/${siteId}/analytics`),
};

export default api;
