import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { syncService } from "../services/sync";

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    // Listen to network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Update queue size every 2 seconds
    const interval = setInterval(async () => {
      const size = await syncService.getQueueSize();
      setQueueSize(size);
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueSize === 0) {
    return null; // Don't show anything when online and queue is empty
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isOnline ? "#f59e0b" : "#ef4444" },
      ]}
    >
      <Text style={styles.text}>
        {isOnline
          ? `🔄 Sincronizando ${queueSize} pendência(s)...`
          : "📡 Modo Offline - Dados serão sincronizados quando conectar"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
