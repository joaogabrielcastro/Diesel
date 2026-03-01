import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../services/api';

export default function OrdersScreen() {
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersApi.getAll();
      return response.data;
    },
    refetchInterval: 5000, // Auto refresh every 5s
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'PREPARING': return '#2196f3';
      case 'READY': return '#4caf50';
      case 'DELIVERED': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'PREPARING': return 'Preparando';
      case 'READY': return 'Pronto';
      case 'DELIVERED': return 'Entregue';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium">
                  Mesa {item.comanda?.table?.number || 'S/N'}
                </Text>
                <Chip
                  style={{ backgroundColor: getStatusColor(item.status) }}
                  textStyle={{ color: '#fff' }}
                >
                  {getStatusLabel(item.status)}
                </Chip>
              </View>

              <Text variant="bodySmall" style={styles.time}>
                {new Date(item.createdAt).toLocaleTimeString('pt-BR')}
              </Text>

              <View style={styles.items}>
                {item.items?.map((orderItem: any) => (
                  <Text key={orderItem.id} variant="bodyMedium">
                    {orderItem.quantity}x {orderItem.product.name}
                    {orderItem.observations && (
                      <Text style={styles.obs}> ({orderItem.observations})</Text>
                    )}
                  </Text>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>Nenhum pedido encontrado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    color: '#999',
    marginBottom: 12,
  },
  items: {
    gap: 4,
  },
  obs: {
    color: '#999',
    fontStyle: 'italic',
  },
});
