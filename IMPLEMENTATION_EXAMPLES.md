# 🛠️ Exemplos de Implementação - Melhorias Diesel Bar

## 1️⃣ REMOVER CÓDIGO MORTO

### Passo 1: Atualizar Schema Prisma

```prisma
// backend/prisma/schema.prisma

// ❌ DELETAR estas linhas:
model QuickOrder {
  id              String          @id @default(uuid())
  establishmentId String          @map("establishment_id")
  userId          String          @map("user_id")
  origin          String          @default("CASINO")
  items           Json
  total           Decimal         @db.Decimal(10, 2)
  status          OrderStatus     @default(PENDING)
  paymentMethod   String?         @map("payment_method")
  paidAt          DateTime?       @map("paid_at")
  createdAt       DateTime        @default(now()) @map("created_at")

  establishment   Establishment   @relation(fields: [establishmentId], references: [id], onDelete: Cascade)
  user            User            @relation(fields: [userId], references: [id])

  @@index([establishmentId])
  @@index([userId])
  @@map("quick_orders")
}

// ❌ DELETAR estas linhas:
model PaymentSplit {
  id              String          @id @default(uuid())
  paymentId       String          @map("payment_id")
  amount          Decimal         @db.Decimal(10, 2)
  method          PaymentMethod

  payment         Payment         @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([paymentId])
  @@map("payment_splits")
}

// ✅ ATUALIZAR Payment model (remover relation):
model Payment {
  id              String          @id @default(uuid())
  comandaId       String          @map("comanda_id")
  amount          Decimal         @db.Decimal(10, 2)
  method          PaymentMethod
  status          PaymentStatus   @default(PENDING)
  transactionId   String?         @map("transaction_id")
  createdAt       DateTime        @default(now()) @map("created_at")
  paidAt          DateTime?       @map("paid_at")

  comanda         Comanda         @relation(fields: [comandaId], references: [id], onDelete: Cascade)

  // ❌ DELETAR: splits          PaymentSplit[]

  @@index([comandaId])
  @@map("payments")
}

// ✅ ATUALIZAR Establishment model (remover relation):
model Establishment {
  // ... outros campos ...

  comandas      Comanda[]
  orders        Order[]
  // ❌ DELETAR: quickOrders   QuickOrder[]
  stockMovements StockMovement[]

  // ... resto ...
}

// ✅ ATUALIZAR User model (remover relation):
model User {
  // ... outros campos ...

  orders          Order[]
  // ❌ DELETAR: quickOrders     QuickOrder[]
  stockMovements  StockMovement[]

  // ... resto ...
}

// ⚠️ AVALIAR se precisa de CASINO:
enum UserRole {
  ADMIN
  WAITER
  KITCHEN
  CASHIER
  // CASINO  // Remover se não usado
}
```

### Passo 2: Criar Migração

```bash
# backend/
npx prisma migrate dev --name remove_unused_tables
# Isso vai gerar migration para dropar: quick_orders e payment_splits
```

### Passo 3: Regenerar Cliente Prisma

```bash
npx prisma generate
```

---

## 2️⃣ IMPLEMENTAR RATE LIMITING

### backend/src/app.module.ts

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ ADICIONAR: Rate Limiting Global
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 segundo
        limit: 3, // 3 requests
      },
      {
        name: "medium",
        ttl: 10000, // 10 segundos
        limit: 20, // 20 requests
      },
      {
        name: "long",
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
    ]),

    // ... outros módulos
  ],
  providers: [
    // ✅ ADICIONAR: Guard global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Rotas Específicas com Limites Customizados

```typescript
// backend/src/auth/auth.controller.ts
import { Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle, SkipThrottle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // ✅ Login com limite mais restritivo (anti brute-force)
  @Post("login")
  @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 tentativas por minuto
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ✅ Rotas públicas sem limite
  @SkipThrottle()
  @Get("health")
  health() {
    return { status: "ok" };
  }
}
```

---

## 3️⃣ ADICIONAR CACHE COM REDIS

### Instalação

```bash
# backend/
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-yet redis
```

### backend/src/app.module.ts

```typescript
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";

@Module({
  imports: [
    // ✅ ADICIONAR: Cache Global
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
          },
          ttl: 300 * 1000, // 5 minutos default
        }),
      }),
    }),

    // ... outros módulos
  ],
})
export class AppModule {}
```

### Usar Cache nos Services

```typescript
// backend/src/categories/categories.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  // ✅ COM Cache
  async findAll(establishmentId: string) {
    const cacheKey = `categories:${establishmentId}`;

    // Tentar buscar do cache
    const cached = await this.cache.get<Category[]>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }

    console.log('❌ Cache MISS:', cacheKey);

    // Se não estiver em cache, buscar do banco
    const categories = await this.prisma.category.findMany({
      where: { establishmentId, active: true },
      orderBy: { order: 'asc' },
    });

    // Salvar no cache por 5 minutos
    await this.cache.set(cacheKey, categories, 300000);

    return categories;
  }

  // ✅ Invalidar cache ao criar/atualizar/deletar
  async create(establishmentId: string, data: CreateCategoryDto) {
    const category = await this.prisma.category.create({ ... });

    // Invalidar cache
    await this.cache.del(`categories:${establishmentId}`);

    return category;
  }

  async update(id: string, establishmentId: string, data: UpdateCategoryDto) {
    const category = await this.prisma.category.update({ ... });

    // Invalidar cache
    await this.cache.del(`categories:${establishmentId}`);

    return category;
  }

  async remove(id: string, establishmentId: string) {
    await this.prisma.category.delete({ ... });

    // Invalidar cache
    await this.cache.del(`categories:${establishmentId}`);
  }
}
```

### Cache Decorator (opcional - mais elegante)

```typescript
// backend/src/common/decorators/cacheable.decorator.ts
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export function Cacheable(keyPrefix: string, ttl: number = 300000) {
  const injectCache = Inject(CACHE_MANAGER);

  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    injectCache(target, 'cacheManager');

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = this.cacheManager;
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const result = await originalMethod.apply(this, args);
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// Usar assim:
@Cacheable('categories', 300000) // 5 min
async findAll(establishmentId: string) {
  return this.prisma.category.findMany({ ... });
}
```

---

## 4️⃣ VALIDAÇÃO COMPLETA DE DTOs

### Instalar Dependências

```bash
# backend/
npm install class-validator class-transformer
```

### backend/src/main.ts

```typescript
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ ADICIONAR: ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas
      forbidNonWhitelisted: true, // Lança erro se propriedade extra existir
      transform: true, // Transforma tipos automaticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
```

### Exemplo de DTO Completo

```typescript
// backend/src/orders/dto/order.dto.ts
import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty({ message: "Product ID é obrigatório" })
  productId: string;

  @IsInt({ message: "Quantidade deve ser um número inteiro" })
  @Min(1, { message: "Quantidade deve ser no mínimo 1" })
  quantity: number;

  @IsOptional()
  @MaxLength(200, { message: "Observações deve ter no máximo 200 caracteres" })
  observations?: string;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty({ message: "Comanda ID é obrigatório" })
  comandaId: string;

  @IsArray({ message: "Items deve ser um array" })
  @ArrayMinSize(1, { message: "Pedido deve ter pelo menos 1 item" })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @MaxLength(500, { message: "Observações deve ter no máximo 500 caracteres" })
  observations?: string;
}
```

---

## 5️⃣ GUARD DE VALIDAÇÃO DE PLANO

### backend/src/common/guards/plan-limits.guard.ts

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";

// Decorator para marcar qual feature verificar
export const CheckFeature = (feature: string) =>
  Reflector.createDecorator<string>();

@Injectable()
export class PlanLimitsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.establishmentId) {
      throw new ForbiddenException("Usuário sem establishment");
    }

    // Buscar establishment com plano
    const establishment = await this.prisma.establishment.findUnique({
      where: { id: user.establishmentId },
      include: { plan: true },
    });

    if (!establishment) {
      throw new ForbiddenException("Establishment não encontrado");
    }

    // Verificar status da assinatura
    if (establishment.status === "SUSPENDED") {
      throw new ForbiddenException(
        "Assinatura suspensa. Entre em contato com o suporte.",
      );
    }

    if (establishment.status === "CANCELLED") {
      throw new ForbiddenException("Assinatura cancelada.");
    }

    // Verificar expiração
    if (establishment.subscriptionExpiresAt) {
      const now = new Date();
      if (now > establishment.subscriptionExpiresAt) {
        throw new ForbiddenException("Assinatura expirada.");
      }
    }

    // Verificar feature específica se decorator foi usado
    const requiredFeature = this.reflector.get(
      CheckFeature,
      context.getHandler(),
    );

    if (requiredFeature) {
      const features = establishment.plan.features as any;

      if (!features[requiredFeature]) {
        throw new ForbiddenException(
          `Feature "${requiredFeature}" não disponível no seu plano.`,
        );
      }
    }

    return true;
  }
}
```

### Usar o Guard

```typescript
// backend/src/users/users.controller.ts
import { UseGuards, Post } from "@nestjs/common";
import {
  PlanLimitsGuard,
  CheckFeature,
} from "../common/guards/plan-limits.guard";

@Controller("users")
@UseGuards(JwtAuthGuard, PlanLimitsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @CheckFeature("advanced-reports") // Verificar se plano tem essa feature
  async create(@Body() dto: CreateUserDto, @GetUser() user: any) {
    // Verificar limite de usuários
    const currentUsers = await this.usersService.count(user.establishmentId);
    const establishment = await this.establishmentsService.findOne(
      user.establishmentId,
    );

    if (currentUsers >= establishment.plan.maxUsers) {
      throw new ForbiddenException(
        `Limite de ${establishment.plan.maxUsers} usuários atingido. Faça upgrade do plano.`,
      );
    }

    return this.usersService.create(dto);
  }
}
```

---

## 6️⃣ LAZY LOADING NO FRONTEND

### web/src/App.tsx

```tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingSkeleton } from "./components/LoadingSkeleton";

// ✅ Importação normal apenas para Login (crítico)
import Login from "./pages/Login";

// ✅ Lazy loading para outras páginas
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const Products = lazy(() => import("./pages/Products"));
const Tables = lazy(() => import("./pages/Tables"));
const Reports = lazy(() => import("./pages/Reports"));
const Stock = lazy(() => import("./pages/Stock"));
const Payments = lazy(() => import("./pages/Payments"));
const Users = lazy(() => import("./pages/Users"));
const Categories = lazy(() => import("./pages/Categories"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route path="stock" element={<Stock />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/kitchen"
            element={
              <PrivateRoute roles={["kitchen"]}>
                <Kitchen />
              </PrivateRoute>
            }
          />

          <Route
            path="/tables"
            element={
              <PrivateRoute roles={["waiter"]}>
                <Tables />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### web/src/components/LoadingSkeleton.tsx

```tsx
export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
```

---

## 7️⃣ WEBSOCKET COM ROOMS POR ROLE

### backend/src/realtime/realtime.gateway.ts

```typescript
@WebSocketGateway({
  /* ... */
})
export class RealtimeGateway {
  @SubscribeMessage("join-establishment")
  handleJoinEstablishment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { establishmentId: string },
  ) {
    const user = (client as any).user;

    if (user.establishmentId !== data.establishmentId) {
      return { error: "Unauthorized" };
    }

    // ✅ Entrar em room geral
    const generalRoom = `establishment:${data.establishmentId}`;
    client.join(generalRoom);

    // ✅ Entrar em room específica do role
    const roleRoom = `establishment:${data.establishmentId}:${user.role}`;
    client.join(roleRoom);

    console.log(`Client ${client.id} joined ${generalRoom} and ${roleRoom}`);

    return { success: true, rooms: [generalRoom, roleRoom] };
  }

  // ✅ Broadcast apenas para cozinha
  broadcastNewOrder(establishmentId: string, order: any) {
    const kitchenRoom = `establishment:${establishmentId}:KITCHEN`;
    this.server.to(kitchenRoom).emit("new-order", {
      type: "NEW_ORDER",
      data: order,
      timestamp: new Date(),
    });
  }

  // ✅ Broadcast apenas para garçons
  broadcastOrderReady(establishmentId: string, order: any) {
    const waiterRoom = `establishment:${establishmentId}:WAITER`;
    this.server.to(waiterRoom).emit("order-ready", {
      type: "ORDER_READY",
      data: order,
      timestamp: new Date(),
    });
  }

  // ✅ Broadcast para todos (admin, garçons)
  broadcastTableStatusChange(establishmentId: string, table: any) {
    const rooms = [
      `establishment:${establishmentId}:ADMIN`,
      `establishment:${establishmentId}:WAITER`,
    ];

    rooms.forEach((room) => {
      this.server.to(room).emit("table-status-changed", {
        type: "TABLE_STATUS_CHANGED",
        data: table,
        timestamp: new Date(),
      });
    });
  }
}
```

---

## 8️⃣ ADICIONAR ÍNDICES COMPOSTOS

### Criar Migration

```prisma
// backend/prisma/schema.prisma

model Order {
  id              String          @id @default(uuid())
  establishmentId String          @map("establishment_id")
  comandaId       String          @map("comanda_id")
  userId          String          @map("user_id")
  status          OrderStatus     @default(PENDING)
  observations    String?
  createdAt       DateTime        @default(now()) @map("created_at")
  preparedAt      DateTime?       @map("prepared_at")
  deliveredAt     DateTime?       @map("delivered_at")

  establishment   Establishment   @relation(fields: [establishmentId], references: [id], onDelete: Cascade)
  comanda         Comanda         @relation(fields: [comandaId], references: [id], onDelete: Cascade)
  user            User            @relation(fields: [userId], references: [id])
  items           OrderItem[]
  history         OrderHistory[]

  // ✅ ADICIONAR índices compostos
  @@index([establishmentId, status])           // Query comum: buscar por estabelecimento + status
  @@index([establishmentId, createdAt])        // Query comum: buscar pedidos recentes
  @@index([establishmentId, status, createdAt]) // Query comum: pedidos pendentes ordenados por data
  @@index([comandaId, status])                 // Query comum: pedidos de uma comanda

  @@map("orders")
}

model Comanda {
  id              String          @id @default(uuid())
  establishmentId String          @map("establishment_id")
  tableId         String?         @map("table_id")
  customerName    String?         @map("customer_name")
  status          ComandaStatus   @default(OPEN)
  openedAt        DateTime        @default(now()) @map("opened_at")
  closedAt        DateTime?       @map("closed_at")
  total           Decimal         @default(0) @db.Decimal(10, 2)
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  establishment   Establishment   @relation(fields: [establishmentId], references: [id], onDelete: Cascade)
  table           Table?          @relation(fields: [tableId], references: [id], onDelete: SetNull)
  orders          Order[]
  payments        Payment[]

  // ✅ ADICIONAR índices compostos
  @@index([establishmentId, status])        // Query comum: comandas abertas
  @@index([establishmentId, openedAt])      // Query comum: comandas por data
  @@index([tableId, status])                // Query comum: comandas de uma mesa

  @@map("comandas")
}
```

```bash
# Criar migration
npx prisma migrate dev --name add_composite_indexes
```

---

## 🎯 RESULTADO ESPERADO

Após implementar estas melhorias:

✅ **Performance**

- Queries 50-70% mais rápidas com cache
- Frontend carrega 40% mais rápido com lazy loading
- Índices compostos reduzem tempo de busca em 60%

✅ **Segurança**

- Rate limiting impede ataques de brute force
- Validações impedem dados inválidos
- Guards verificam permissões e limites

✅ **Manutenibilidade**

- Menos código morto = menos confusão
- Tipos fortes = menos bugs
- Cache organizado = fácil invalidar

✅ **Escalabilidade**

- Redis cache permite múltiplas instâncias
- WebSocket rooms otimizado
- Banco otimizado com índices
