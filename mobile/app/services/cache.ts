import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresIn?: number;
}

class CacheService {
  private prefix = "diesel_cache_";

  async set<T>(key: string, data: T, expiresInMs?: number): Promise<void> {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    };

    try {
      await AsyncStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(cacheItem),
      );
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);

      // Check if expired
      if (cacheItem.expiresIn) {
        const age = Date.now() - cacheItem.timestamp;
        if (age > cacheItem.expiresIn) {
          await this.remove(key);
          return null;
        }
      }

      return cacheItem.data;
    } catch (error) {
      console.error("Error getting cache:", error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.error("Error removing cache:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

export const cacheService = new CacheService();
