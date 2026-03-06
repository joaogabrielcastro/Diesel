import axios from "axios";
import { useAuthStore } from "../store/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
};

export const ordersApi = {
  getAll: () => api.get("/orders"),
  getKitchen: () => api.get("/orders/kitchen"),
  create: (data: any) => api.post("/orders", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
};

export const productsApi = {
  getAll: () => api.get("/products"),
  create: (data: any) => api.post("/products", data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const tablesApi = {
  getAll: () => api.get("/tables"),
  create: (data: any) => api.post("/tables", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tables/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/tables/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get("/categories"),
  create: (data: any) => api.post("/categories", data),
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const paymentsApi = {
  getAll: () => api.get("/payments"),
  process: (comandaId: string, data: any) =>
    api.post(`/payments/${comandaId}`, data),
};

export const comandasApi = {
  getAll: (status?: string) => api.get("/comandas", { params: { status } }),
  getOne: (id: string) => api.get(`/comandas/${id}`),
  getByTable: (tableId: string) => api.get(`/comandas/table/${tableId}`),
  create: (data: any) => api.post("/comandas", data),
  close: (id: string) => api.patch(`/comandas/${id}/close`),
};

export const usersApi = {
  getAll: () => api.get("/users"),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle`),
};

export const reportsApi = {
  getSales: (startDate: string, endDate: string) =>
    api.get("/reports/sales", { params: { startDate, endDate } }),
  getTopProducts: (startDate: string, endDate: string, limit?: number) =>
    api.get("/reports/products/top-selling", {
      params: { startDate, endDate, limit },
    }),
  getRevenue: (
    startDate: string,
    endDate: string,
    groupBy: "day" | "week" | "month",
  ) => api.get("/reports/revenue", { params: { startDate, endDate, groupBy } }),
  getOrdersStatus: (startDate: string, endDate: string) =>
    api.get("/reports/orders/status", { params: { startDate, endDate } }),
  getPeakHours: (startDate: string, endDate: string) =>
    api.get("/reports/peak-hours", { params: { startDate, endDate } }),
  getDashboardStats: () => api.get("/reports/dashboard"),
};

export const stockApi = {
  getAll: (lowStock?: boolean) => api.get("/stock", { params: { lowStock } }),
  getAlerts: () => api.get("/stock/alerts"),
  getMovements: (startDate?: string, endDate?: string) =>
    api.get("/stock/movements", { params: { startDate, endDate } }),
  getPredictions: () => api.get("/stock/predictions"),
  getByProduct: (productId: string) => api.get(`/stock/${productId}`),
  createMovement: (data: any) => api.post("/stock/movement", data),
  updateStock: (productId: string, data: any) =>
    api.patch(`/stock/${productId}`, data),
  createIngredient: (data: any) => api.post("/stock/ingredient", data),
  deleteIngredient: (id: string) => api.delete(`/stock/ingredient/${id}`),
};

export default api;
