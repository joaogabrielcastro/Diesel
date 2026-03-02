# 📱 Mobile Offline Integration - Diesel Bar

## ✅ Implementado

### 1. **Database Local (SQLite)**

- **Arquivo**: `app/services/database.ts`
- **Tabelas criadas**:
  - `categories` - Categorias de produtos
  - `products` - Produtos com cache local
  - `orders` - Pedidos offline
  - `order_items` - Itens dos pedidos
  - `sync_queue` - Fila de sincronização

### 2. **Cache Service**

- **Arquivo**: `app/services/cache.ts`
- **Features**:
  - AsyncStorage wrapper com TTL (Time To Live)
  - Expiração automática de dados
  - Gerenciamento de cache por chave

### 3. **Sync Service**

- **Arquivo**: `app/services/sync.ts`
- **Features**:
  - Fila de ações pendentes
  - Auto-sync quando voltar online
  - Retry logic (máximo 3 tentativas)
  - Suporte para GET, POST, PATCH, DELETE

### 4. **Hook Offline API**

- **Arquivo**: `app/services/useOfflineApi.ts`
- **Métodos disponíveis**:
  - `getCategories()` - Busca categorias (online/offline)
  - `getProducts(categoryId?)` - Busca produtos
  - `getComandas()` - Busca comandas
  - `createOrder(orderData)` - Cria pedido (queued se offline)
  - `updateOrderStatus(orderId, status)` - Atualiza status
  - `isOnline` - Estado da conexão

### 5. **Network Status Component**

- **Arquivo**: `app/components/NetworkStatus.tsx`
- **Features**:
  - Indicador visual do status de rede
  - Mostra quantidade de itens na fila
  - Auto-hide quando online e sem pendências

## 🚀 Como Usar

### Exemplo básico em uma tela:

```tsx
import { useOfflineApi } from "../services/useOfflineApi";

export default function MyScreen() {
  const { getProducts, createOrder, isOnline } = useOfflineApi();

  // Buscar produtos (funciona offline!)
  const loadProducts = async () => {
    const products = await getProducts();
    setProducts(products);
  };

  // Criar pedido (queued se offline)
  const handleCreateOrder = async () => {
    const order = await createOrder({
      comandaId: "123",
      items: [{ productId: "abc", quantity: 2, price: 10.5 }],
    });
    console.log("Order created:", order);
  };

  return (
    <View>
      <Text>{isOnline ? "Online" : "Offline"}</Text>
      {/* Seu conteúdo */}
    </View>
  );
}
```

## 📝 Fluxo de Trabalho Offline

### Cenário 1: Online → Offline

1. Usuário carrega produtos enquanto online
2. Dados são salvos em SQLite + cache
3. Conexão cai
4. Usuário continua navegando (dados do cache)
5. Usuário cria pedido → vai para fila
6. NetworkStatus mostra "Modo Offline"

### Cenário 2: Offline → Online

1. Conexão restaurada
2. SyncService detecta automaticamente
3. Processa fila de pendências
4. Marca pedidos como sincronizados
5. NetworkStatus desaparece

## 🧪 Testar Modo Offline

### No iOS Simulator:

1. Settings → Developer → Network Link Conditioner
2. Enable → Select "100% Loss"

### No Android Emulator:

1. Settings → Network & Internet
2. Airplane mode ON

### No código:

```tsx
// Simular offline manualmente
import NetInfo from "@react-native-community/netinfo";
NetInfo.fetch().then((state) => {
  console.log("Connection type", state.type);
  console.log("Is connected?", state.isConnected);
});
```

## 📊 Monitoramento

### Ver fila de sincronização:

```tsx
import { syncService } from "./services/sync";

const queueSize = await syncService.getQueueSize();
console.log(`${queueSize} items pending sync`);
```

### Limpar cache (desenvolvimento):

```tsx
import { cacheService } from "./services/cache";
await cacheService.clear();
```

### Limpar banco de dados:

```tsx
import { databaseService } from "./services/database";
await databaseService.clearAll();
```

## ⚙️ Configurações

### TTL do Cache (em milissegundos):

- **Categorias**: 1 hora (3600000ms)
- **Produtos**: 1 hora (3600000ms)
- **Comandas**: 5 minutos (300000ms)

### Sync Settings:

- **Max Retries**: 3 tentativas
- **Auto-sync**: Ativado (quando voltar online)

## 🔧 Próximos Passos (Opcional)

- [ ] Adicionar sincronização incremental (diff)
- [ ] Background sync (quando app em background)
- [ ] Sync de imagens de produtos
- [ ] Conflict resolution (se dados mudaram no servidor)
- [ ] Métricas de sincronização (tempo, sucesso/falha)

## 📦 Dependências Instaladas

```json
{
  "expo-sqlite": "^14.0.6",
  "@react-native-community/netinfo": "^11.4.1"
}
```

## ✅ Status da Implementação

- ✅ SQLite database schema
- ✅ Cache service com TTL
- ✅ Sync queue com retry
- ✅ Hook useOfflineApi
- ✅ NetworkStatus component
- ✅ Integração no layout principal
- ✅ Exemplo de uso
- ✅ Documentação completa

**Implementação funcional e pronta para testes!**
