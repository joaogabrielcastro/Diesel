# Arquitetura - Diesel Bar SaaS

## Visão Geral

O Diesel Bar é uma aplicação SaaS multi-tenant para gestão de bares, restaurantes e casas noturnas, composta por três aplicações principais:

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Mobile  │  │  Web     │  │ Printer  │         │
│  │ (Garçom) │  │ (Admin)  │  │ Térmica  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
└───────┼─────────────┼─────────────┼───────────────┘
        │             │             │
        │   HTTP/WS   │   HTTP/WS   │   TCP/IP
        │             │             │
┌───────▼─────────────▼─────────────▼───────────────┐
│              BACKEND API (NestJS)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Auth     │  │ Orders   │  │ Payments │        │
│  │ Products │  │ Stock    │  │ Reports  │        │
│  │ Tables   │  │ Users    │  │ Realtime │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼───────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────┐
│           CAMADA DE DADOS                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │PostgreSQL│  │  Redis   │  │  S3/CDN  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. Backend API (NestJS)

**Responsabilidades:**
- API REST para todas as operações
- WebSocket para atualizações em tempo real
- Autenticação e autorização (JWT)
- Lógica de negócio
- Validação de dados
- Integração com serviços externos

**Tecnologias:**
- NestJS (Framework Node.js)
- TypeScript
- Prisma ORM
- Socket.io
- JWT para auth
- Bull para filas

**Módulos:**
- `auth` - Autenticação e autorização
- `users` - Gestão de usuários
- `establishments` - Multi-tenant
- `orders` - Pedidos
- `products` - Produtos e categorias
- `stock` - Controle de estoque
- `tables` - Gestão de mesas
- `comandas` - Comandas e fechamento
- `payments` - Pagamentos
- `quick-orders` - Pedidos rápidos (cassino)
- `realtime` - WebSocket gateway

### 2. Mobile App (React Native + Expo)

**Responsabilidades:**
- Interface para garçons
- Criar e gerenciar pedidos
- Consultar produtos
- Visualizar mesas e comandas
- Modo offline com sincronização

**Tecnologias:**
- React Native 0.73
- Expo Router
- TanStack Query (cache e sincronização)
- Zustand (state management)
- React Native Paper (UI)
- Socket.io client

**Telas Principais:**
- Login
- Lista de pedidos
- Novo pedido (busca de produtos)
- Detalhes da comanda
- Perfil do usuário

### 3. Web Dashboard (React + Vite)

**Responsabilidades:**
- Painel administrativo
- Dashboard com métricas
- Painel da cozinha (KDS)
- Gestão de produtos e categorias
- Gestão de mesas
- Relatórios e analytics
- Configurações do sistema

**Tecnologias:**
- React 18
- Vite
- TypeScript
- TanStack Query + Table
- Tailwind CSS
- Recharts (gráficos)
- Socket.io client

**Páginas:**
- Dashboard (visão geral)
- Cozinha (KDS)
- Produtos
- Mesas
- Relatórios
- Configurações

## Banco de Dados

### PostgreSQL (Principal)

**Modelo Multi-Tenant:**
- Cada estabelecimento tem seu próprio `establishmentId`
- Isolamento lógico de dados
- Row-level security

**Principais Tabelas:**
- `establishments` - Estabelecimentos
- `plans` - Planos de assinatura
- `users` - Usuários do sistema
- `tables` - Mesas
- `comandas` - Comandas abertas/fechadas
- `products` - Produtos
- `categories` - Categorias
- `ingredients` - Ingredientes
- `orders` - Pedidos
- `order_items` - Itens do pedido
- `payments` - Pagamentos
- `stock_movements` - Movimentações de estoque

### Redis (Cache e Sessões)

**Uso:**
- Cache de produtos e categorias
- Sessões de usuário
- Rate limiting
- Fila de jobs (Bull)
- Pub/Sub para real-time

## Fluxo de Dados

### 1. Fluxo de Pedido

```
1. Garçom abre app → Seleciona mesa → Cria comanda
2. Busca produtos → Adiciona ao carrinho
3. Confirma pedido → POST /api/orders
4. Backend:
   - Valida dados
   - Cria order e order_items
   - Decrementa estoque
   - Emite evento WebSocket
5. Cozinha recebe notificação em tempo real
6. Cozinha visualiza pedido → Marca como "em preparo"
7. Finaliza preparo → Marca como "pronto"
8. Garçom recebe notificação → Entrega ao cliente
9. Marca como "entregue"
```

### 2. Fluxo de Autenticação

```
1. Usuário faz login → POST /api/auth/login
2. Backend valida credenciais
3. Retorna JWT token + dados do usuário
4. Client armazena token (localStorage/AsyncStorage)
5. Todas as requisições incluem: Authorization: Bearer <token>
6. Backend valida token via JwtAuthGuard
7. Extrai userId e establishmentId do token
8. Aplica filtro por establishment automaticamente
```

### 3. Fluxo Real-time (WebSocket)

```
1. Client conecta: socket.connect()
2. Join room: socket.emit('join-establishment', establishmentId)
3. Backend emite eventos:
   - new-order (novo pedido)
   - order-updated (status atualizado)
   - comanda-updated (comanda alterada)
4. Clients escutam eventos e atualizam UI
5. TanStack Query invalida cache e refetch automático
```

## Segurança

### Autenticação
- JWT com expiração de 7 dias
- Senha hasheada com bcrypt (10 rounds)
- Refresh token (futuro)

### Autorização
- Role-based access control (ADMIN, WAITER, KITCHEN, CASHIER, CASINO)
- Guards do NestJS
- Verificação de estabelecimento em todas as queries

### Validação
- DTOs com class-validator
- Sanitização de inputs
- Rate limiting (100 req/min)

### Multi-Tenant
- Filtro automático por establishmentId
- Isolamento de dados
- Impossível acessar dados de outro estabelecimento

## Escalabilidade

### Horizontal Scaling

**Backend:**
- Load balancer (nginx/ALB)
- Múltiplas instâncias do backend
- Sticky sessions para WebSocket
- Redis cluster para compartilhar sessões

**Banco de Dados:**
- Read replicas para queries pesadas
- Connection pooling
- Índices otimizados
- Particionamento por estabelecimento (futuro)

### Cache Strategy

**Níveis:**
1. Client-side (TanStack Query - 5min)
2. Redis (produtos, categorias - 1h)
3. PostgreSQL (query cache)

**Invalidação:**
- Manual após mutations
- TTL automático
- WebSocket events

### Performance

**Otimizações:**
- Lazy loading de imagens
- Pagination em listas grandes
- Debounce em buscas
- Virtual scrolling
- Code splitting
- CDN para assets estáticos

## Monitoramento e Logs

**Ferramentas Recomendadas:**
- Sentry (error tracking)
- Datadog/Grafana (metrics)
- Winston (logs estruturados)
- PostgreSQL slow query log

**Métricas Importantes:**
- Request rate e latência
- Error rate
- Database connections
- WebSocket connections ativas
- Memory e CPU usage
- Tempo de resposta por endpoint

## Backup e Recovery

**Estratégia:**
- Backup diário do PostgreSQL
- Retenção de 30 dias
- Backup incremental a cada 4h
- Testes mensais de restore
- Redis persistence (AOF)

## Roadmap Técnico

**Curto Prazo (3 meses):**
- [ ] Testes automatizados (80% coverage)
- [ ] CI/CD pipeline
- [ ] Monitoring e alertas
- [ ] Docker compose para dev

**Médio Prazo (6 meses):**
- [ ] Migração para microserviços
- [ ] GraphQL API
- [ ] Elastic Search para buscas
- [ ] Queue para impressão

**Longo Prazo (12 meses):**
- [ ] Kubernetes para orquestração
- [ ] Multi-region deployment
- [ ] Event sourcing
- [ ] Machine learning para previsões
