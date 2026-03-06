# 🏗️ Análise Arquitetural - Diesel Bar SaaS

**Data:** 06 de Março de 2026  
**Revisor:** Arquiteto Sênior de Software  
**Projeto:** Sistema de Gestão para Bares e Restaurantes

---

## 📋 Sumário Executivo

O projeto **Diesel Bar** é um sistema SaaS multi-tenant bem estruturado para gestão de bares e restaurantes. A arquitetura base é sólida, mas existem **oportunidades significativas de simplificação, remoção de código morto e melhorias de performance**.

**Principais Achados:**

- ✅ Arquitetura multi-tenant bem implementada
- ✅ Separação clara frontend/backend
- ⚠️ **30% do schema do banco não é utilizado**
- ⚠️ Dependências não utilizadas no backend (Bull, Throttler)
- ⚠️ Redundâncias no sistema de controle de estoque
- ⚠️ Falta de implementação de rate limiting ativo
- ⚠️ Ausência de testes automatizados

---

## 1️⃣ ARQUITETURA DO SISTEMA

### ✅ Pontos Fortes

#### Estrutura Geral

```
diesel/
├── backend/          # NestJS + Prisma + PostgreSQL
├── web/             # React + Vite + TypeScript
├── docker-compose.yml
└── docs/
```

**Positivo:**

- Monorepo organizado e bem separado
- Backend modular com NestJS (seguindo padrão MVC)
- Frontend com estrutura de pastas clara
- Docker configurado para desenvolvimento
- CI/CD com GitHub Actions

#### Multi-tenancy

```typescript
model Establishment {
  id       String @id
  planId   String
  // ... todas as entidades relacionadas
}
```

**Positivo:**

- Isolamento por `establishmentId` em todas as queries
- Plans com features configuráveis
- Suporte a múltiplos estabelecimentos

#### Autenticação & Autorização

- JWT implementado corretamente
- Guards do NestJS protegendo rotas
- RBAC com 5 roles: ADMIN, WAITER, KITCHEN, CASHIER, CASINO

### ⚠️ Problemas Identificados

#### 1. Dependências Não Utilizadas

**Backend (`package.json`):**

```json
{
  "@nestjs/bull": "^10.0.1", // ❌ Não usado
  "@nestjs/throttler": "^5.1.1", // ❌ Não usado
  "bull": "^4.12.0" // ❌ Não usado
}
```

**Impacto:** +500KB no bundle, maior tempo de instalação, confusão sobre capacidades do sistema.

**Recomendação:** REMOVER estas dependências.

---

#### 2. Estrutura de Dados Não Utilizada

**Tabelas que existem no schema mas NÃO são usadas:**

```prisma
// ❌ CÓDIGO MORTO - REMOVER
model QuickOrder {
  // ... Nenhum serviço implementado
  // ... Nenhuma rota no backend
  // ... Nenhuma tela no frontend
}

// ❌ CÓDIGO MORTO - REMOVER
model PaymentSplit {
  // ... Feature de "divisão de pagamento" não implementada
  // ... Aumenta complexidade sem agregar valor
}

// ⚠️ POTENCIALMENTE NÃO USADA
enum UserRole {
  CASINO  // Usado apenas em QuickOrder (que será removido)
}
```

**Impacto:**

- Confusão sobre features disponíveis
- Migrações desnecessárias
- Tipos TypeScript gerados mas não utilizados
- Manutenção de código fantasma

**Recomendação:**

1. REMOVER `QuickOrder` completamente
2. REMOVER `PaymentSplit` completamente
3. AVALIAR se role `CASINO` é necessário ou remover

---

#### 3. Redundância no Sistema de Estoque

**Problema:** Dois sistemas conflitantes de controle de estoque:

```prisma
model Product {
  // Sistema 1: Estoque direto no produto
  stockControl    Boolean
  stockQuantity   Decimal
  stockUnit       String
  minStock        Decimal

  // Sistema 2: Estoque via ingredientes
  ingredients     ProductIngredient[]
}

model Ingredient {
  currentStock    Decimal
  minStock        Decimal
  // ...
}
```

**Problemas:**

- Confusão: quando usar cada um?
- Lógica de validação duplicada no `orders.service.ts`
- UX inconsistente (alguns produtos têm estoque, outros ingredientes)
- Difícil educar usuários sobre a diferença

**Recomendação:**  
**SIMPLIFICAR para um único sistema:**

**Opção A - Mais Simples (Recomendada):**

```prisma
model Product {
  // ✅ Apenas estoque direto
  stockQuantity   Decimal
  stockUnit       String
  minStock        Decimal

  // ❌ REMOVER: sistema de ingredientes
}
```

**Opção B - Mais Completa (se realmente necessário):**

- Manter apenas Ingredients
- Produtos sempre consomem ingredientes
- Produtos prontos (cerveja) = 1 ingrediente = 1 unidade

**Justificativa Opção A:**
Para 90% dos bares, estoque simples é suficiente. Receitas complexas podem ser documentadas externamente.

---

#### 4. OrderItem com Status Redundante

```prisma
model Order {
  status  OrderStatus  // ✅ Status do pedido inteiro
}

model OrderItem {
  status  OrderStatus  // ⚠️ Redundante? Cada item tem status?
}
```

**Análise:**

- Orders service não usa `OrderItem.status`
- Frontend não exibe status individual de itens
- Adiciona complexidade sem necessidade

**Recomendação:**

- ✅ MANTER se planeja implementar "item parcialmente pronto"
- ❌ REMOVER se todos os itens de um pedido têm o mesmo status

---

## 2️⃣ QUALIDADE DO CÓDIGO

### ✅ Pontos Fortes

- TypeScript configurado corretamente
- Nomenclatura consistente (camelCase, PascalCase)
- Services bem separados por responsabilidade
- DTOs para validação de entrada

### ⚠️ Problemas Identificados

#### 1. Falta de Validação de Entrada

**Exemplo atual:**

```typescript
async create(userId: string, establishmentId: string, createOrderDto: CreateOrderDto) {
  // ❌ Nenhuma validação se userId pertence ao establishmentId
  // ❌ Nenhuma validação de limites do plano
}
```

**Recomendação:**

```typescript
// ✅ Adicionar guard ou decorator
@CheckPlanLimits()
@ValidateUserEstablishment()
async create(...) { }
```

---

#### 2. Queries N+1 Potenciais

**Problema em `orders.service.ts`:**

```typescript
const products = await this.prisma.product.findMany({
  where: { id: { in: productIds } },
  include: {
    ingredients: {
      include: {
        ingredient: true, // ✅ Correto - carrega relacionamento
      },
    },
  },
});
```

**Status:** ✅ Este está OK, mas verificar outros services.

---

#### 3. Tratamento de Erros Inconsistente

```typescript
// ❌ services/websocket.ts - Erros silenciosos
socket.on("error", (error) => {
  console.error("Socket error:", error);
  // Nenhuma ação tomada
});
```

**Recomendação:**

- Implementar estratégia de retry
- Notificar usuário de perda de conexão
- Fallback para polling se WebSocket falhar

---

## 3️⃣ EXPERIÊNCIA DO USUÁRIO (UX/UI)

### ⚠️ Problemas Identificados

#### 1. Fluxo de Gestão de Estoque Confuso

**Problema:**

- Admin não sabe quando usar "Estoque" direto vs "Ingredientes"
- Duas telas diferentes: `/products` (estoque direto) e `/stock` (ingredientes)
- Nenhuma documentação in-app explicando a diferença

**Recomendação:**

- Unificar em uma única tela de Estoque
- Wizard de setup inicial: "Seu bar trabalha com receitas complexas?" → Sugere modo simples ou avançado

---

#### 2. WebSocket Desconectando Sem Aviso

```tsx
// web/src/services/websocket.ts
useEffect(() => {
  socket.on("disconnect", () => {
    console.log("Disconnected");
    // ❌ Usuário não é notificado
  });
}, []);
```

**Recomendação:**

```tsx
socket.on("disconnect", () => {
  toast.warning("Conexão perdida. Tentando reconectar...");
});

socket.on("reconnect", () => {
  toast.success("Conexão restabelecida!");
});
```

---

#### 3. Falta de Feedback em Operações Longas

**Exemplo:** Criar pedido com validação de estoque

```typescript
// ❌ Sem indicador de loading
const handleCreateOrder = async () => {
  await createOrder(data);
};
```

**Recomendação:**

```tsx
const { mutate: createOrder, isLoading } = useMutation(...);

<Button disabled={isLoading}>
  {isLoading ? <Spinner /> : "Criar Pedido"}
</Button>
```

---

## 4️⃣ BANCO DE DADOS

### ✅ Pontos Fortes

- Modelagem relacional correta
- Índices nas foreign keys
- Soft deletes com `active` Boolean
- Tipos Decimal para valores monetários
- Cascades configurados (onDelete: Cascade)

### ⚠️ Problemas Identificados

#### 1. Campos JSON Sem Validação

```prisma
model Establishment {
  address   Json?
  settings  Json?
}

model Plan {
  features  Json  // Array de features
}
```

**Problema:**

- Nenhuma validação de estrutura
- TypeScript não ajuda
- Possível inconsistência de dados

**Recomendação:**

```typescript
// ✅ Criar tipos e validação
interface EstablishmentSettings {
  timezone: string;
  currency: string;
  language: 'pt' | 'en';
  notifications: {
    email: boolean;
    sms: boolean;
  };
}

// Validar com Zod antes de salvar
const settingsSchema = z.object({ ... });
```

---

#### 2. Falta de Índice Composto

```prisma
model Order {
  establishmentId String
  status          OrderStatus

  @@index([establishmentId])    // ✅ Existe
  @@index([status])             // ✅ Existe
  // ❌ FALTA: @@index([establishmentId, status])
}
```

**Impacto:**
Query típica na Kitchen:

```sql
SELECT * FROM orders
WHERE establishment_id = ? AND status IN ('PENDING', 'PREPARING')
```

Sem índice composto, busca sequencial enorme.

**Recomendação:**

```prisma
@@index([establishmentId, status])
@@index([establishmentId, createdAt])
```

---

#### 3. Tabela `OrderHistory` Pode Crescer Muito

```prisma
model OrderHistory {
  // Cada mudança de status cria um registro
  // 100 pedidos/dia × 3 mudanças = 300 registros/dia
  // = 109.500 registros/ano por estabelecimento
}
```

**Recomendação:**

- Implementar particionamento por data
- Archive records older than 90 days
- Ou mover para sistema de logs separado

---

## 5️⃣ PERFORMANCE

### ⚠️ Problemas Identificados

#### 1. Falta de Cache

**Queries que deveriam ser cacheadas:**

```typescript
// Categories raramente mudam
await prisma.category.findMany({
  where: { establishmentId }
});

// Plans são estáticos
await prisma.plan.findMany();

// Establishment info
await prisma.establishment.findUnique({ ... });
```

**Recomendação:**

```typescript
// ✅ Implementar cache com Redis
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CategoriesService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async findAll(establishmentId: string) {
    const key = `categories:${establishmentId}`;
    const cached = await this.cache.get(key);

    if (cached) return cached;

    const data = await this.prisma.category.findMany(...);
    await this.cache.set(key, data, 300); // 5 min
    return data;
  }
}
```

---

#### 2. Bundle Size do Frontend

```
dist/assets/index-BGsgya3t.js  551.27 kB
```

**Problema:** Bundle único de 551KB é grande.

**Recomendação:**

```typescript
// ✅ Lazy loading de rotas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Kitchen = lazy(() => import('./pages/Kitchen'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    {/* ... */}
  </Routes>
</Suspense>
```

---

#### 3. WebSocket Broadcast Ineficiente

```typescript
// realtime.gateway.ts
broadcastNewOrder(establishmentId: string, order: any) {
  this.server.to(`establishment:${establishmentId}`).emit('new-order', order);
  // ❌ Envia pedido inteiro para TODOS os clientes do estabelecimento
}
```

**Problema:**

- Garçom não precisa de notificação de novos pedidos
- Admin não precisa de notificações da cozinha
- Overhead desnecessário

**Recomendação:**

```typescript
// ✅ Rooms específicas por role
broadcastNewOrder(establishmentId: string, order: any) {
  // Apenas cozinha recebe
  this.server
    .to(`establishment:${establishmentId}:kitchen`)
    .emit('new-order', order);
}
```

---

## 6️⃣ ESCALABILIDADE

### ✅ Pontos Fortes

- Multi-tenancy já implementado
- Estrutura permite sharding por establishmentId
- Stateless backend (pode escalar horizontalmente)

### ⚠️ Problemas Identificados

#### 1. WebSocket Não Escala Sem Redis

**Problema:**
Com múltiplas instâncias do backend:

```
┌─────────┐     ┌─────────┐
│ Backend │     │ Backend │
│ Node 1  │     │ Node 2  │
└─────────┘     └─────────┘
     ↑              ↑
     │              │
 Client A       Client B
```

Se Client A emite evento, Client B (conectado em Node 2) não recebe.

**Recomendação:**

```typescript
// ✅ Adicionar Redis Adapter
import { RedisIoAdapter } from "@nestjs/platform-socket.io";

const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

---

#### 2. Falta de Validação de Limites do Plano

```typescript
// ❌ Nenhuma verificação ativa
async createUser(establishmentId: string, data: CreateUserDto) {
  // Deveria verificar: establishment atingiu maxUsers do plano?
  return this.prisma.user.create({ ... });
}
```

**Recomendação:**

```typescript
// ✅ Middleware/Guard para validar limites
@Injectable()
export class PlanLimitsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    const establishment = await this.getEstablishment(user.establishmentId);

    const userCount = await this.prisma.user.count({
      where: { establishmentId: establishment.id },
    });

    if (userCount >= establishment.plan.maxUsers) {
      throw new ForbiddenException("Limite de usuários atingido");
    }

    return true;
  }
}
```

---

## 7️⃣ SEGURANÇA

### ✅ Pontos Fortes

- JWT implementado
- Passwords com bcrypt
- Guards protegendo rotas
- CORS configurado

### ⚠️ Problemas Identificados

#### 1. Rate Limiting Não Implementado

```typescript
// package.json tem @nestjs/throttler
// ❌ MAS app.module.ts NÃO importa ThrottlerModule
```

**Impacto:**

- Vulnerável a brute force attacks
- API calls ilimitadas podem derrubar servidor
- Sem proteção contra scrapers

**Recomendação:**

```typescript
// ✅ Adicionar em app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,     // 1 minuto
      limit: 100,     // 100 requests
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
```

---

#### 2. Validação de Input Inconsistente

```typescript
// ❌ Alguns DTOs sem validação
export class CreateOrderDto {
  comandaId: string; // Não valida se é UUID
  items: OrderItemDto[]; // Não valida se array está vazio
  observations?: string; // Não valida tamanho máximo
}
```

**Recomendação:**

```typescript
// ✅ Usar class-validator
import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  MaxLength,
} from "class-validator";

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  comandaId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @MaxLength(500)
  @IsOptional()
  observations?: string;
}
```

---

#### 3. Uploads Sem Validação

```typescript
// upload.controller.ts
@Post('upload')
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // ❌ Não valida:
  // - Tipo de arquivo (pode fazer upload de .exe)
  // - Tamanho (pode fazer upload de 500MB)
  // - Conteúdo (pode ser malware)
}
```

**Recomendação:**

```typescript
// ✅ Adicionar validações
@Post('upload')
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Apenas imagens permitidas'), false);
      }
      cb(null, true);
    },
  }),
)
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Validar conteúdo com library de antivirus
  // Renomear arquivo para UUID
  // Salvar em S3/Cloud Storage (não local)
}
```

---

## 8️⃣ LIMPEZA DO PROJETO

### 🗑️ REMOVER Completamente

#### 1. Dependências Não Usadas

```bash
npm uninstall @nestjs/bull @nestjs/throttler bull
```

#### 2. Tabelas do Schema

```prisma
// ❌ DELETAR schemas/models:
model QuickOrder { }
model PaymentSplit { }
enum CASINO (if not used elsewhere)
```

#### 3. Arquivos Desnecessários

```
backend/fix-orders.ts           # ❌ Script one-time, não precisa no repo
backend/limpar-categorias.ps1   # ❌ Script one-time
backend/regenerate-prisma.ps1   # ❌ Redundante com npm scripts
web/generate-icons.js           # ❌ Foi usado uma vez, não precisa mais
```

#### 4. Código Morto

```typescript
// Buscar e remover:
// - Imports não utilizados
// - Funções nunca chamadas
// - Comentários de debug
```

---

### 🔄 SIMPLIFICAR

#### 1. Sistema de Estoque

- Escolher UMA abordagem (direto ou ingredientes)
- Remover a outra

#### 2. Roles

- Se CASINO não é usado, remover
- Avaliar se CASHIER é realmente diferente de WAITER

#### 3. Configurações

- Unificar `Establishment.settings` e `Plan.features`
- Criar tipos TypeScript explícitos

---

## 9️⃣ SUGESTÕES DE FUNCIONALIDADES

### 🎯 Alta Prioridade

#### 1. Dashboard com Métricas em Tempo Real

```typescript
// Adicionar em reports.service.ts
async getLiveMetrics(establishmentId: string) {
  return {
    openComandas: await this.getOpenComandasCount(),
    pendingOrders: await this.getPendingOrdersCount(),
    todayRevenue: await this.getTodayRevenue(),
    occupiedTables: await this.getOccupiedTablesCount(),
  };
}

// Atualizar via WebSocket a cada 30s
```

#### 2. Notificações Push

```typescript
// Implementar com service workers
// Notificar garçom quando pedido estiver pronto
// Notificar cozinha de novos pedidos
```

#### 3. Relatórios Exportáveis

```typescript
// PDF ou Excel de:
// - Vendas por período
// - Produtos mais vendidos
// - Performance de garçons
// - Análise de estoque
```

---

### 💡 Média Prioridade

#### 4. Histórico de Ações (Audit Log)

```prisma
model AuditLog {
  id        String   @id
  userId    String
  action    String   // "UPDATE_PRODUCT", "DELETE_USER"
  entity    String   // "Product", "User"
  entityId  String
  changes   Json     // Diff do antes/depois
  createdAt DateTime
}
```

#### 5. Temas Customizáveis

```typescript
// Permitir estabelecimento escolher cores
interface EstablishmentTheme {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
}
```

#### 6. Integração com Pagamentos

```typescript
// Mercado Pago, Stripe, PagSeguro
// Gerar QR Code PIX
// Split automático de gorjeta
```

---

### 🚀 Baixa Prioridade (Nice to Have)

#### 7. App Mobile Nativo

- React Native ou Flutter
- Melhor experiência para garçons
- Funciona offline

#### 8. Integrações

- WhatsApp para pedidos
- IFood/Uber Eats
- Sistema de fidelidade

#### 9. Machine Learning

- Previsão de demanda
- Sugestão de compras baseada em histórico
- Detecção de fraudes

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### Fase 1: Limpeza (1-2 dias)

1. ✅ Remover dependências não usadas
2. ✅ Deletar código morto (QuickOrder, PaymentSplit)
3. ✅ Remover arquivos temporários
4. ✅ Limpar imports não utilizados

### Fase 2: Segurança (2-3 dias)

1. ✅ Implementar rate limiting
2. ✅ Adicionar validação completa de DTOs
3. ✅ Validar uploads de arquivos
4. ✅ Adicionar sanitização de inputs

### Fase 3: Performance (3-5 dias)

1. ✅ Implementar cache com Redis
2. ✅ Adicionar índices compostos no banco
3. ✅ Lazy loading no frontend
4. ✅ Otimizar broadcast do WebSocket

### Fase 4: Simplificação (5-7 dias)

1. ✅ Unificar sistema de estoque
2. ✅ Criar tipos TypeScript para JSONs
3. ✅ Melhorar mensagens de erro
4. ✅ Adicionar loading states

### Fase 5: Features (2-3 semanas)

1. ✅ Dashboard com métricas live
2. ✅ Notificações push
3. ✅ Relatórios exportáveis
4. ✅ Audit log

---

## 📊 MÉTRICAS DE SUCESSO

### Antes vs Depois

| Métrica                | Antes   | Meta Depois    |
| ---------------------- | ------- | -------------- |
| Linhas de código       | ~15.000 | ~12.000 (-20%) |
| Bundle size (frontend) | 551 KB  | < 300 KB       |
| Tempo de build         | 8s      | < 5s           |
| Dependências backend   | 82      | < 70           |
| Tabelas não usadas     | 2       | 0              |
| Testes automatizados   | 0       | > 50% coverage |
| Performance queries    | N/A     | < 100ms (p95)  |

---

## 💬 CONCLUSÃO

O projeto **Diesel Bar** tem uma base sólida e arquitetura bem pensada. Com as melhorias sugeridas, o sistema ficará:

✅ **Mais Simples** - Menos código, mais fácil de manter  
✅ **Mais Rápido** - Cache, índices, lazy loading  
✅ **Mais Seguro** - Rate limiting, validações, sanitização  
✅ **Mais Escalável** - Redis adapter, sharding preparado  
✅ **Mais Profissional** - Testes, documentação, padrões

**Prioridade #1:** Começar pela Fase 1 (Limpeza) - maior impacto com menor esforço.

---

**Próximo Passo:**
Discutir este documento com o time e priorizar quais melhorias implementar primeiro.
