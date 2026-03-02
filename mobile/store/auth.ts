import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "admin" | "garcom" | "cozinha";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: async (token, user) => {
    await AsyncStorage.setItem("@auth_token", token);
    await AsyncStorage.setItem("@auth_user", JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await AsyncStorage.removeItem("@auth_token");
    await AsyncStorage.removeItem("@auth_user");
    set({ token: null, user: null });
  },

  loadFromStorage: async () => {
    const token = await AsyncStorage.getItem("@auth_token");
    const userStr = await AsyncStorage.getItem("@auth_user");
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },
}));
