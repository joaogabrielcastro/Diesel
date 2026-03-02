import axios from "axios";
import { useAuthStore } from "../store/auth";

const api = axios.create({
  baseURL: "/api",
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
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
};

export const productsApi = {
  getAll: () => api.get("/products"),
  create: (data: any) => api.post("/products", data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const tablesApi = {
  getAll: () => api.get("/tables"),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tables/${id}/status`, { status }),
};

export const categoriesApi = {
  getAll: () => api.get("/categories"),
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
};

export default api;
