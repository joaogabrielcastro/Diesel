import { useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { authApi } from "./services/api";
import { useAuthStore } from "./store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("garcom@demo.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authApi.login(email, password);
      const { access_token, user } = response.data;

      await setAuth(access_token, user);
      router.replace("/(tabs)/orders");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          🍺 Diesel Bar
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sistema de Pedidos
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Entrar
        </Button>

        <Text variant="bodySmall" style={styles.demo}>
          Demo: garcom@demo.com / 123456
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    color: "#ff6b00",
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 48,
    color: "#999",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  error: {
    color: "#ff4444",
    textAlign: "center",
    marginTop: 8,
  },
  demo: {
    textAlign: "center",
    marginTop: 24,
    color: "#666",
  },
});
