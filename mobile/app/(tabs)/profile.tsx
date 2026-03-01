import { View, StyleSheet } from "react-native";
import { Text, Button, Avatar, List } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={user?.name?.charAt(0) || "U"} />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
        <Text variant="bodySmall" style={styles.role}>
          {user?.role}
        </Text>
      </View>

      <List.Section style={styles.section}>
        <List.Item
          title="Meus Pedidos"
          left={(props) => <List.Icon {...props} icon="clipboard-list" />}
          onPress={() => {}}
        />
        <List.Item
          title="Configurações"
          left={(props) => <List.Icon {...props} icon="cog" />}
          onPress={() => {}}
        />
        <List.Item
          title="Ajuda"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          onPress={() => {}}
        />
      </List.Section>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#ff4444"
      >
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#2a2a2a",
  },
  name: {
    marginTop: 16,
  },
  email: {
    color: "#999",
    marginTop: 4,
  },
  role: {
    color: "#ff6b00",
    marginTop: 4,
    textTransform: "uppercase",
  },
  section: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  logoutButton: {
    margin: 16,
    borderColor: "#ff4444",
  },
});
