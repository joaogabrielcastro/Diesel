# 🎯 Roadmap de Melhorias - Diesel Bar

## 📊 Status Atual vs Completo

### ✅ Implementado (70% completo)

- Backend API com 12 módulos
- Autenticação JWT
- Banco de dados multi-tenant
- CRUD de produtos, pedidos, mesas, comandas
- WebSocket real-time (estrutura)
- Frontend web (6 páginas)
- Mobile app (4 telas)
- Testes básicos (10 testes)
- Docker e CI/CD configurados

### ⚠️ Pendente para MVP (30% restante)

---

## 🔴 CRÍTICO - Necessário para MVP

### 1. **Sistema de Pagamentos**

**Impacto:** Alto | **Prioridade:** 🔴 Crítica

**O que falta:**

- [ ] Integração com gateway (Stripe/Mercado Pago)
- [ ] Finalizar comanda com pagamento
- [ ] Divisão de conta entre clientes
- [ ] Histórico de pagamentos
- [ ] Recibos/Notas fiscais

**Arquivos a criar:**

```
backend/src/payments/
  ├── payments.service.ts (implementar)
  ├── payments.controller.ts (implementar)
  ├── dto/process-payment.dto.ts
  └── integrations/
      ├── stripe.service.ts
      └── mercadopago.service.ts

web/src/pages/
  └── Payments.tsx (nova página)

mobile/app/(tabs)/
  └── payment.tsx (nova tela)
```

**Estimativa:** 3-4 dias

---

### 2. **Upload de Imagens**

**Impacto:** Alto | **Prioridade:** 🔴 Crítica

**O que falta:**

- [ ] Upload de fotos de produtos
- [ ] Upload de logo do estabelecimento
- [ ] Integração com S3/Cloudinary
- [ ] Redimensionamento automático
- [ ] Preview de imagens no mobile/web

**Arquivos a criar:**

```
backend/src/upload/
  ├── upload.module.ts
  ├── upload.service.ts
  ├── upload.controller.ts
  └── config/
      ├── multer.config.ts
      └── cloudinary.config.ts

web/src/components/
  ├── ImageUploader.tsx
  └── ImagePreview.tsx
```

**Estimativa:** 2-3 dias

---

### 3. **Notificações em Tempo Real**

**Impacto:** Alto | **Prioridade:** 🟡 Alta

**O que falta:**

- [ ] Conectar WebSocket no frontend
- [ ] Notificações push no mobile (FCM)
- [ ] Sons de alerta para novos pedidos
- [ ] Badge de notificações não lidas
- [ ] Configurações de notificações

**Arquivos a modificar/criar:**

```
backend/src/realtime/
  └── realtime.gateway.ts (melhorar implementação)

web/src/services/
  └── websocket.ts (criar)

mobile/app/services/
  ├── websocket.ts (criar)
  └── notifications.ts (criar)

mobile/app.json
  └── adicionar plugins FCM
```

**O que fazer:**

```typescript
// web/src/services/websocket.ts
import io from "socket.io-client";

export const socket = io("http://localhost:3000", {
  auth: { token: localStorage.getItem("token") },
});

socket.on("new-order", (order) => {
  // Tocar som
  new Audio("/notification.mp3").play();
  // Mostrar toast
  toast.success(`Novo pedido #${order.id}`);
});
```

**Estimativa:** 2 dias

---

### 4. **Melhorias de UX/UI**

**Impacto:** Médio | **Prioridade:** 🟡 Alta

**O que falta:**

- [ ] Loading states (skeletons)
- [ ] Error boundaries
- [ ] Toasts/Feedback visual
- [ ] Confirmações de ações críticas
- [ ] Animações de transição
- [ ] Responsividade mobile-first
- [ ] Dark mode toggle

**Arquivos a criar:**

```
web/src/components/
  ├── LoadingSkeleton.tsx
  ├── ErrorBoundary.tsx
  ├── Toast.tsx
  └── ConfirmDialog.tsx

web/src/hooks/
  ├── useToast.ts
  └── useConfirm.ts
```

**Estimativa:** 2-3 dias

---

## 🟡 IMPORTANTE - Para Produção

### 5. **Modo Offline (Mobile)**

**Impacto:** Médio | **Prioridade:** 🟡 Alta

**O que falta:**

- [ ] Cache local com SQLite
- [ ] Fila de pedidos offline
- [ ] Sincronização ao reconectar
- [ ] Indicador de status da conexão

**Tecnologias:**

```bash
expo install @react-native-async-storage/async-storage
expo install expo-sqlite
```

**Estimativa:** 3-4 dias

---

### 6. **Relatórios e Analytics**

**Impacto:** Médio | **Prioridade:** 🟡 Alta

**O que falta:**

- [ ] Dashboard com métricas reais
- [ ] Gráficos de vendas (Recharts já instalado!)
- [ ] Produtos mais vendidos
- [ ] Performance por garçom
- [ ] Horários de pico
- [ ] Exportação PDF/Excel

**Arquivos a implementar:**

```
backend/src/reports/
  ├── reports.module.ts
  ├── reports.service.ts
  ├── reports.controller.ts
  └── dto/report.dto.ts

web/src/pages/
  └── Reports.tsx (implementar gráficos)
```

**Endpoints a criar:**

```typescript
GET /api/reports/sales?start=2026-01-01&end=2026-01-31
GET /api/reports/products/top-selling
GET /api/reports/waiters/performance
GET /api/reports/peak-hours
```

**Estimativa:** 3 dias

---

### 7. **Gestão de Estoque Avançada**

**Impacto:** Médio | **Prioridade:** 🟢 Média

**O que falta:**

- [ ] Alertas de estoque baixo
- [ ] Previsão de consumo
- [ ] Relatório de desperdício
- [ ] Histórico de movimentações
- [ ] Inventário periódico

**Arquivos a criar:**

```
backend/src/stock/
  ├── stock.service.ts (melhorar)
  ├── stock.controller.ts (criar)
  └── dto/stock.dto.ts

web/src/pages/
  └── Stock.tsx (nova página)
```

**Estimativa:** 2 dias

---

### 8. **Sistema de Reservas**

**Impacto:** Médio | **Prioridade:** 🟢 Média

**O que falta:**

- [ ] Criar reserva com data/hora
- [ ] Calendário de reservas
- [ ] Confirmação por SMS/Email
- [ ] Notificação de chegada
- [ ] Gerenciamento de no-shows

**Arquivos a criar:**

```
backend/src/reservations/
  ├── reservations.module.ts
  ├── reservations.service.ts
  ├── reservations.controller.ts
  └── dto/reservation.dto.ts

prisma/schema.prisma:
  model Reservation {
    id              String
    tableId         String
    customerName    String
    customerPhone   String
    date            DateTime
    time            String
    guests          Int
    status          ReservationStatus
  }

web/src/pages/
  └── Reservations.tsx
```

**Estimativa:** 3 dias

---

## 🟢 MELHORIAS - Para Escala

### 9. **Autenticação Avançada**

**O que falta:**

- [ ] Recuperação de senha
- [ ] Verificação de email
- [ ] 2FA (Two-Factor Auth)
- [ ] OAuth (Google, Facebook)
- [ ] Gestão de sessões ativas

**Estimativa:** 2 dias

---

### 10. **Testes Completos**

**Status atual:** 10 testes | **Meta:** 80+ testes

**O que falta:**

- [ ] Testes E2E (30 cenários)
- [ ] Testes de integração (40 testes)
- [ ] Testes unitários adicionais (30 testes)
- [ ] Testes de carga (Artillery/k6)
- [ ] Coverage > 80%

**Arquivos a criar:**

```
backend/test/
  ├── auth.e2e-spec.ts (expandir)
  ├── orders.e2e-spec.ts
  ├── products.e2e-spec.ts
  ├── payments.e2e-spec.ts
  └── load/
      └── load-test.yml

backend/src/**/
  └── *.spec.ts (criar para cada service)
```

**Comandos:**

```bash
npm run test:cov  # Coverage
npm run test:e2e  # E2E
npm run test:load # Load testing
```

**Estimativa:** 4-5 dias

---

### 11. **Segurança**

**O que falta:**

- [ ] Rate limiting por usuário
- [ ] Validação de input rigorosa
- [ ] Sanitização de dados
- [ ] Audit log de ações
- [ ] Criptografia de dados sensíveis
- [ ] Proteção contra CSRF
- [ ] Headers de segurança (Helmet)

**Implementar:**

```typescript
// backend/src/main.ts
import helmet from "@nestjs/platform-express";

app.use(helmet());
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(","),
  credentials: true,
});
```

**Estimativa:** 2 dias

---

### 12. **Performance**

**O que falta:**

- [ ] Cache com Redis (estrutura existe)
- [ ] Paginação em todas listagens
- [ ] Lazy loading de imagens
- [ ] Compressão de resposta (gzip)
- [ ] CDN para assets estáticos
- [ ] Database indexes
- [ ] Query optimization

**Implementar:**

```sql
-- Adicionar indexes no schema.prisma
@@index([establishmentId])
@@index([status])
@@index([createdAt])
```

**Estimativa:** 2 dias

---

### 13. **Internacionalização (i18n)**

**O que falta:**

- [ ] Suporte multi-idioma (PT, EN, ES)
- [ ] Formatação de moeda por região
- [ ] Formatação de data/hora
- [ ] Traduções no backend e frontend

**Bibliotecas:**

```bash
npm install i18next react-i18next
npm install @nestjs/i18n
```

**Estimativa:** 3 dias

---

### 14. **Integrações Externas**

**O que falta:**

- [ ] iFood, Uber Eats
- [ ] WhatsApp Business API
- [ ] SMS (Twilio)
- [ ] Email (SendGrid)
- [ ] ERP/Contabilidade

**Estimativa:** 5+ dias (cada integração)

---

## 📈 Roadmap Priorizado

### **Sprint 1 (Esta semana)** - MVP Core

1. ✅ Backend funcionando
2. ✅ Banco Neon configurado
3. ✅ Testes básicos
4. 🔄 Notificações tempo real (WebSocket)
5. 🔄 Melhorias UX (loading, toasts)

### **Sprint 2 (Semana 2)** - Pagamentos

1. Sistema de pagamentos completo
2. Upload de imagens
3. Melhorias de interface

### **Sprint 3 (Semana 3)** - Analytics

1. Relatórios e dashboards
2. Modo offline mobile
3. Gestão de estoque

### **Sprint 4 (Semana 4)** - Features Extras

1. Sistema de reservas
2. Testes completos (80% coverage)
3. Segurança e performance

### **Sprint 5+ (Mês 2)** - Escala

1. Autenticação avançada
2. i18n
3. Integrações externas

---

## ⚡ Quick Wins (Pode fazer AGORA)

### 1. **Conectar WebSocket no Web** (30min)

```typescript
// web/src/App.tsx
import { useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

useEffect(() => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  socket.emit("join-establishment", user.establishmentId);

  socket.on("new-order", (order) => {
    console.log("Novo pedido:", order);
    // Adicionar toast aqui
  });

  return () => socket.disconnect();
}, []);
```

### 2. **Adicionar Loading States** (1h)

```typescript
// web/src/pages/Dashboard.tsx
import { Loader2 } from 'lucide-react';

{isLoading ? (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="animate-spin" size={48} />
  </div>
) : (
  // conteúdo
)}
```

### 3. **Adicionar Toasts** (1h)

```bash
cd web
npm install sonner
```

```typescript
// web/src/App.tsx
import { Toaster } from 'sonner';

<Toaster position="top-right" />
```

### 4. **Paginação** (2h)

```typescript
// backend/src/products/products.service.ts
async findAll(establishmentId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where: { establishmentId },
      skip,
      take: limit,
    }),
    this.prisma.product.count({ where: { establishmentId } }),
  ]);

  return {
    data: products,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
```

---

## 📊 Métricas de Conclusão

| Categoria        | Atual  | Meta      | Progresso |
| ---------------- | ------ | --------- | --------- |
| **Features**     | 12/20  | 20        | 60%       |
| **Testes**       | 10     | 80+       | 12%       |
| **Coverage**     | ~30%   | 80%       | 37%       |
| **Páginas Web**  | 6      | 10        | 60%       |
| **Telas Mobile** | 4      | 8         | 50%       |
| **Integrações**  | 0      | 5         | 0%        |
| **Segurança**    | Básica | Avançada  | 40%       |
| **Performance**  | OK     | Otimizada | 50%       |

---

## 🎯 Objetivo Final

### MVP (4 semanas):

- ✅ Sistema completo de pedidos
- ✅ Pagamentos integrados
- ✅ Notificações real-time
- ✅ Upload de imagens
- ✅ Relatórios básicos
- ✅ 50+ testes
- ✅ Deploy em produção

### Produto Completo (2-3 meses):

- ✅ Todos os 20 módulos
- ✅ 80%+ coverage de testes
- ✅ 5+ integrações externas
- ✅ Multi-idioma
- ✅ 1000+ usuários simultâneos
- ✅ Documentação completa

---

## 💡 Recomendações Imediatas

1. **HOJE:** Conectar WebSocket + Toasts (2h)
2. **AMANHÃ:** Sistema de pagamentos (começar)
3. **SEMANA 1:** Completar MVP core features
4. **SEMANA 2:** Deploy em produção (Railway)
5. **SEMANA 3:** Feedback de usuários beta
6. **SEMANA 4:** Ajustes e lançamento

---

**Quer que eu implemente alguma dessas features agora?** 🚀
