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
};

export const tablesApi = {
  getAll: () => api.get("/tables"),
};

export const categoriesApi = {
  getAll: () => api.get("/categories"),
};

export default api;
