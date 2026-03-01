import axios from "axios";
import { useAuthStore } from "../store/auth";

const API_URL = "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
};

// Orders
export const ordersApi = {
  getAll: () => api.get("/orders"),
  getKitchen: () => api.get("/orders/kitchen"),
  create: (data: any) => api.post("/orders", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
};

// Products
export const productsApi = {
  getAll: (categoryId?: string) =>
    api.get("/products", { params: { categoryId } }),
  search: (query: string) =>
    api.get("/products/search", { params: { q: query } }),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get("/categories"),
};

// Tables
export const tablesApi = {
  getAll: () => api.get("/tables"),
  create: (data: any) => api.post("/tables", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tables/${id}/status`, { status }),
};

// Comandas
export const comandasApi = {
  getAll: (status?: string) => api.get("/comandas", { params: { status } }),
  getOne: (id: string) => api.get(`/comandas/${id}`),
  create: (data: any) => api.post("/comandas", data),
  close: (id: string) => api.patch(`/comandas/${id}/close`),
};
