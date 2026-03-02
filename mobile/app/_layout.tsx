import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { View } from "react-native";
import { NetworkStatus } from "./components/NetworkStatus";

const queryClient = new QueryClient();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#ff6b00",
    secondary: "#ffa500",
    background: "#1a1a1a",
    surface: "#2a2a2a",
  },
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <View style={{ flex: 1 }}>
          <NetworkStatus />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </PaperProvider>
    </QueryClientProvider>
  );
}
