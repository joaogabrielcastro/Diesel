import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "./store/auth";

export default function Index() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.replace("/(tabs)/orders");
    } else {
      router.replace("/login");
    }
  }, [token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff6b00" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
});
