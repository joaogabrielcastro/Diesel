import { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Card, Button, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../services/api';

export default function NewOrderScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      return response.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      const response = await productsApi.getAll(selectedCategory || undefined);
      return response.data;
    },
  });

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Searchbar
          placeholder="Buscar produto..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.categories}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(
                selectedCategory === item.id ? null : item.id
              )}
              style={styles.categoryChip}
            >
              {item.icon} {item.name}
            </Chip>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={products?.filter((p: any) =>
          searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.products}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => addToCart(item)}
          >
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text variant="bodyLarge" style={styles.price}>
                  R$ {item.price.toFixed(2)}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text variant="bodySmall">{getTotalItems()} itens</Text>
            <Text variant="titleLarge">R$ {getTotal().toFixed(2)}</Text>
          </View>
          <Button mode="contained" onPress={() => {}}>
            Enviar Pedido
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  search: {
    padding: 16,
  },
  searchbar: {
    backgroundColor: '#2a2a2a',
  },
  categories: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  products: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
  },
  card: {
    backgroundColor: '#2a2a2a',
  },
  price: {
    color: '#ff6b00',
    fontWeight: 'bold',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
});
