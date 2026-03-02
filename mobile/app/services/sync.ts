import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { api } from "./api";

export interface PendingAction {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  data?: any;
  timestamp: number;
  retries: number;
}

class SyncService {
  private queueKey = "diesel_sync_queue";
  private maxRetries = 3;
  private isOnline = true;
  private isSyncing = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came online, sync
      if (wasOffline && this.isOnline) {
        console.log("Network restored, syncing...");
        this.syncPendingActions();
      }
    });
  }

  async addToQueue(
    action: Omit<PendingAction, "id" | "timestamp" | "retries">,
  ): Promise<void> {
    const pendingAction: PendingAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    try {
      const queue = await this.getQueue();
      queue.push(pendingAction);
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
      console.log("Action added to sync queue:", pendingAction);
    } catch (error) {
      console.error("Error adding to sync queue:", error);
    }
  }

  private async getQueue(): Promise<PendingAction[]> {
    try {
      const queueJson = await AsyncStorage.getItem(this.queueKey);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error("Error getting sync queue:", error);
      return [];
    }
  }

  private async setQueue(queue: PendingAction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error("Error setting sync queue:", error);
    }
  }

  async syncPendingActions(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      const queue = await this.getQueue();
      console.log(`Syncing ${queue.length} pending actions...`);

      const remaining: PendingAction[] = [];

      for (const action of queue) {
        try {
          // Execute the action
          await this.executeAction(action);
          console.log(`Synced action: ${action.method} ${action.endpoint}`);
        } catch (error) {
          console.error(`Failed to sync action:`, error);

          // Retry if not exceeded max retries
          if (action.retries < this.maxRetries) {
            remaining.push({
              ...action,
              retries: action.retries + 1,
            });
          } else {
            console.warn("Max retries exceeded for action:", action);
          }
        }
      }

      // Update queue with remaining actions
      await this.setQueue(remaining);

      if (remaining.length === 0) {
        console.log("All actions synced successfully!");
      } else {
        console.log(`${remaining.length} actions remaining in queue`);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async executeAction(action: PendingAction): Promise<any> {
    switch (action.method) {
      case "GET":
        return api.get(action.endpoint);
      case "POST":
        return api.post(action.endpoint, action.data);
      case "PATCH":
        return api.patch(action.endpoint, action.data);
      case "DELETE":
        return api.delete(action.endpoint);
      default:
        throw new Error(`Unsupported method: ${action.method}`);
    }
  }

  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.queueKey);
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const syncService = new SyncService();
