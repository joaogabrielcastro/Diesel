import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  establishmentId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: async (token: string, user: User) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ token: null, user: null });
  },

  loadAuth: async () => {
    const token = await AsyncStorage.getItem("token");
    const userStr = await AsyncStorage.getItem("user");
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },
}));
