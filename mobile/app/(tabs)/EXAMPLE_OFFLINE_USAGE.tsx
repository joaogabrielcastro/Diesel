// Exemplo de uso do hook useOfflineApi em uma tela

import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useOfflineApi } from "../services/useOfflineApi";

export default function ProductsScreen() {
  const { getCategories, getProducts, isOnline } = useOfflineApi();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
    setLoading(false);
  };

  const loadProducts = async (categoryId?: string) => {
    setLoading(true);
    try {
      const data = await getProducts(categoryId);
      setProducts(data);
      setSelectedCategory(categoryId || null);
    } catch (error) {
      console.error("Error loading products:", error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isOnline ? "🟢 Online" : "🔴 Offline"}
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Button
              mode={selectedCategory === item.id ? "contained" : "outlined"}
              onPress={() => loadProducts(item.id)}
              style={styles.categoryButton}
            >
              {item.name}
            </Button>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Products */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodyMedium">R$ {item.price}</Text>
              {item.description && (
                <Text variant="bodySmall">{item.description}</Text>
              )}
            </Card.Content>
          </Card>
        )}
        refreshing={loading}
        onRefresh={() => loadProducts(selectedCategory || undefined)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  statusBar: {
    padding: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoriesSection: {
    padding: 12,
    backgroundColor: "#2a2a2a",
  },
  categoryButton: {
    marginRight: 8,
  },
  productCard: {
    margin: 12,
  },
});
