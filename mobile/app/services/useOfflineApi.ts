import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { api } from "./api";
import { cacheService } from "./cache";
import { syncService } from "./sync";
import { databaseService } from "./database";

export const useOfflineApi = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Initialize database
    databaseService.init().catch((error) => {
      console.error("Failed to initialize database:", error);
    });

    return () => unsubscribe();
  }, []);

  // Get categories with offline support
  const getCategories = async () => {
    try {
      if (isOnline) {
        // Try to fetch from API
        const response = await api.get("/categories");
        const categories = response.data;

        // Save to cache and database
        await cacheService.set("categories", categories, 3600000); // 1 hour
        await databaseService.saveCategories(categories);

        return categories;
      } else {
        // Offline: get from database
        const categories = await databaseService.getCategories();
        if (categories.length > 0) {
          return categories;
        }

        // Fallback to cache
        const cached = await cacheService.get("categories");
        return cached || [];
      }
    } catch (error) {
      console.error("Error getting categories:", error);
      // Try database fallback
      const categories = await databaseService.getCategories();
      if (categories.length > 0) return categories;

      // Last resort: cache
      const cached = await cacheService.get("categories");
      return cached || [];
    }
  };

  // Get products with offline support
  const getProducts = async (categoryId?: string) => {
    const cacheKey = categoryId ? `products_${categoryId}` : "products";

    try {
      if (isOnline) {
        // Try to fetch from API
        const response = await api.get("/products", {
          params: categoryId ? { categoryId } : {},
        });
        const products = response.data;

        // Save to cache and database
        await cacheService.set(cacheKey, products, 3600000); // 1 hour
        if (!categoryId) {
          await databaseService.saveProducts(products);
        }

        return products;
      } else {
        // Offline: get from database
        const products = await databaseService.getProducts(categoryId);
        if (products.length > 0) {
          return products;
        }

        // Fallback to cache
        const cached = await cacheService.get(cacheKey);
        return cached || [];
      }
    } catch (error) {
      console.error("Error getting products:", error);
      // Try database fallback
      const products = await databaseService.getProducts(categoryId);
      if (products.length > 0) return products;

      // Last resort: cache
      const cached = await cacheService.get(cacheKey);
      return cached || [];
    }
  };

  // Create order with offline support
  const createOrder = async (orderData: any) => {
    const orderId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (isOnline) {
        // Online: send directly to API
        const response = await api.post("/orders", orderData);
        return response.data;
      } else {
        // Offline: save to local database and queue
        const localOrder = {
          id: orderId,
          ...orderData,
          createdAt: new Date().toISOString(),
          status: "PENDING",
        };

        await databaseService.saveOrder(localOrder, orderData.items);

        // Add to sync queue
        await syncService.addToQueue({
          endpoint: "/orders",
          method: "POST",
          data: { ...orderData, tempId: orderId },
        });

        return localOrder;
      }
    } catch (error) {
      console.error("Error creating order:", error);

      // If online request fails, fallback to offline mode
      const localOrder = {
        id: orderId,
        ...orderData,
        createdAt: new Date().toISOString(),
        status: "PENDING",
      };

      await databaseService.saveOrder(localOrder, orderData.items);
      await syncService.addToQueue({
        endpoint: "/orders",
        method: "POST",
        data: { ...orderData, tempId: orderId },
      });

      return localOrder;
    }
  };

  // Get comandas with offline support
  const getComandas = async () => {
    const cacheKey = "comandas";

    try {
      if (isOnline) {
        const response = await api.get("/comandas");
        const comandas = response.data;

        // Save to cache
        await cacheService.set(cacheKey, comandas, 300000); // 5 minutes

        return comandas;
      } else {
        // Offline: get from cache
        const cached = await cacheService.get(cacheKey);
        return cached || [];
      }
    } catch (error) {
      console.error("Error getting comandas:", error);
      const cached = await cacheService.get(cacheKey);
      return cached || [];
    }
  };

  // Update order status with offline support
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      if (isOnline) {
        const response = await api.patch(`/orders/${orderId}/status`, {
          status,
        });
        return response.data;
      } else {
        // Offline: queue the update
        await syncService.addToQueue({
          endpoint: `/orders/${orderId}/status`,
          method: "PATCH",
          data: { status },
        });

        return { id: orderId, status };
      }
    } catch (error) {
      console.error("Error updating order status:", error);

      // Fallback to queue
      await syncService.addToQueue({
        endpoint: `/orders/${orderId}/status`,
        method: "PATCH",
        data: { status },
      });

      return { id: orderId, status };
    }
  };

  return {
    isOnline,
    getCategories,
    getProducts,
    getComandas,
    createOrder,
    updateOrderStatus,
  };
};
