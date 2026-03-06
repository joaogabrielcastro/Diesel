# 🗺️ Roadmap de Implementação - Diesel Bar

## 📅 FASE 1: LIMPEZA E PREPARAÇÃO (2-3 dias)

### Dia 1: Remover Código Morto

**Checklist:**

- [ ] Remover modelos do schema: `QuickOrder`, `PaymentSplit`
- [ ] Remover relations em `Payment`, `Establishment`, `User`
- [ ] Avaliar e remover role `CASINO` se não usado
- [ ] Criar migration: `npx prisma migrate dev --name remove_unused_tables`
- [ ] Regenerar cliente: `npx prisma generate`
- [ ] Desinstalar dependências: `npm uninstall @nestjs/bull @nestjs/throttler bull`
- [ ] Remover arquivos temporários:
  ```bash
  rm backend/fix-orders.ts
  rm backend/limpar-categorias.ps1
  rm backend/regenerate-prisma.ps1
  rm web/generate-icons.js
  ```
- [ ] Testar aplicação após limpeza
- [ ] Commit: `feat: remove unused tables and dependencies`

**Scripts:**

```bash
# backend/
cd backend
npm uninstall @nestjs/bull @nestjs/throttler bull
npx prisma migrate dev --name remove_unused_tables
npx prisma generate
npm run build
npm test

# Testar se tudo compila
cd ../web
npm run build
```

---

### Dia 2: Limpar Imports e Código

**Checklist:**

- [ ] Instalar ferramenta: `npm install -g ts-prune`
- [ ] Executar: `ts-prune` para encontrar exports não usados
- [ ] Remover imports não utilizados (IDE faz isso)
- [ ] Remover comentários de debug/console.logs desnecessários
- [ ] Padronizar nomenclatura (se necessário)
- [ ] Commit: `refactor: clean unused imports and code`

**Script Automatizado:**

```bash
# Encontrar todos os console.logs (revisar manualmente)
grep -r "console.log" backend/src --exclude-dir=node_modules

# Remover automaticamente (CUIDADO!)
# find backend/src -name "*.ts" -exec sed -i '/console\.log/d' {} \;
```

---

### Dia 3: Documentação e Organização

**Checklist:**

- [ ] Atualizar README.md com arquitetura atual
- [ ] Criar/atualizar CONTRIBUTING.md
- [ ] Documentar variáveis de ambiente (.env.example)
- [ ] Adicionar JSDoc em funções complexas
- [ ] Atualizar package.json (description, author, etc)
- [ ] Commit: `docs: update project documentation`

---

## 📅 FASE 2: SEGURANÇA (3-4 dias)

### Dia 4: Rate Limiting

**Checklist:**

- [ ] Reinstalar (se foi removido): `npm install @nestjs/throttler`
- [ ] Configurar ThrottlerModule em `app.module.ts`
- [ ] Adicionar ThrottlerGuard global
- [ ] Customizar limites para rota de login
- [ ] Testar com script de stress test
- [ ] Commit: `feat: add rate limiting`

**Teste:**

```bash
# Usar Apache Bench ou similar
ab -n 100 -c 10 http://localhost:3000/api/auth/login
# Deve receber 429 Too Many Requests após limite
```

---

### Dia 5: Validação de DTOs

**Checklist:**

- [ ] Instalar: `npm install class-validator class-transformer`
- [ ] Adicionar ValidationPipe global em `main.ts`
- [ ] Atualizar todos os DTOs com decorators:
  - [ ] AuthDto (login, register)
  - [ ] CreateOrderDto, OrderItemDto
  - [ ] CreateProductDto, UpdateProductDto
  - [ ] CreateUserDto, UpdateUserDto
  - [ ] CreateTableDto, UpdateTableDto
  - [ ] CreateCategoryDto, UpdateCategoryDto
- [ ] Testar cada endpoint com dados inválidos
- [ ] Commit: `feat: add comprehensive input validation`

**Teste:**

```bash
# Testar com curl
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": []}'  # Deve retornar erro de validação
```

---

### Dia 6: Validação de Uploads

**Checklist:**

- [ ] Criar `FileValidationPipe` customizado
- [ ] Validar tipos permitidos: jpg, jpeg, png, gif
- [ ] Validar tamanho máximo: 5MB
- [ ] Renomear arquivos para UUID
- [ ] Adicionar sanitização de nome de arquivo
- [ ] Configurar em todas as rotas de upload
- [ ] Commit: `feat: add file upload validation`

**Teste:**

```bash
# Tentar fazer upload de arquivo grande/inválido
curl -X POST http://localhost:3000/api/upload \
  -F "file=@malicious.exe"  # Deve retornar erro
```

---

### Dia 7: Guards de Permissão

**Checklist:**

- [ ] Criar `PlanLimitsGuard`
- [ ] Criar decorator `@CheckFeature()`
- [ ] Aplicar em rotas críticas (criar usuário, criar produto)
- [ ] Testar bloqueio quando limite atingido
- [ ] Adicionar mensagens de erro claras
- [ ] Commit: `feat: add plan limits validation`

---

## 📅 FASE 3: PERFORMANCE (4-5 dias)

### Dia 8-9: Implementar Cache Redis

**Checklist:**

- [ ] Instalar Redis localmente ou Docker
- [ ] Instalar pacotes: `npm install @nestjs/cache-manager cache-manager cache-manager-redis-yet redis`
- [ ] Configurar CacheModule em `app.module.ts`
- [ ] Adicionar cache em:
  - [ ] CategoriesService.findAll()
  - [ ] ProductsService.findAll()
  - [ ] EstablishmentsService.findOne()
  - [ ] PlansService.findAll()
- [ ] Implementar invalidação de cache em updates/deletes
- [ ] Testar performance antes/depois com benchmark
- [ ] Commit: `feat: add Redis cache for frequently accessed data`

**docker-compose.yml:**

```yaml
# Adicionar serviço Redis
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
```

**Benchmark:**

```bash
# Antes do cache
ab -n 1000 -c 50 http://localhost:3000/api/categories

# Depois do cache (deve ser 10x+ mais rápido)
ab -n 1000 -c 50 http://localhost:3000/api/categories
```

---

### Dia 10: Otimizar Queries do Banco

**Checklist:**

- [ ] Adicionar índices compostos no schema
- [ ] Criar migration: `npx prisma migrate dev --name add_composite_indexes`
- [ ] Analisar slow queries (se tiver logs)
- [ ] Otimizar queries N+1 (adicionar `include` onde necessário)
- [ ] Testar performance de queries críticas
- [ ] Commit: `perf: add composite indexes and optimize queries`

**Queries para Otimizar:**

```typescript
// Antes: 2 queries
const orders = await prisma.order.findMany({ ... });
for (const order of orders) {
  const items = await prisma.orderItem.findMany({ orderId: order.id });
}

// Depois: 1 query
const orders = await prisma.order.findMany({
  include: { items: true }
});
```

---

### Dia 11: Lazy Loading Frontend

**Checklist:**

- [ ] Atualizar `App.tsx` com `lazy()` e `Suspense`
- [ ] Criar componente `LoadingSkeleton`
- [ ] Testar carregamento de cada rota
- [ ] Analisar bundle size antes/depois
- [ ] Commit: `perf: add lazy loading for routes`

**Análise de Bundle:**

```bash
# Antes
npm run build
# Verificar size em dist/assets/

# Depois do lazy loading
npm run build
# Deve ter múltiplos chunks menores
```

---

### Dia 12: Otimizar WebSocket

**Checklist:**

- [ ] Implementar rooms por role (kitchen, waiter, admin)
- [ ] Atualizar broadcasts para rooms específicas
- [ ] Adicionar heartbeat para detectar clientes mortos
- [ ] Implementar reconnection automática no frontend
- [ ] Testar com múltiplos clientes conectados
- [ ] Commit: `perf: optimize WebSocket with role-based rooms`

---

## 📅 FASE 4: MELHORIAS DE UX (5-7 dias)

### Dia 13-14: Feedback Visual

**Checklist:**

- [ ] Adicionar loading states em todos os botões de ação
- [ ] Adicionar skeletons em listas (produtos, pedidos, etc)
- [ ] Melhorar mensagens de erro (mais específicas)
- [ ] Adicionar toasts de sucesso/erro consistentes
- [ ] Implementar confirmação em ações destrutivas
- [ ] Commit: `feat: improve loading and error feedback`

---

### Dia 15: Notificações WebSocket

**Checklist:**

- [ ] Adicionar notificação sonora para novos pedidos (cozinha)
- [ ] Adicionar notificação visual para pedido pronto (garçom)
- [ ] Implementar badge com contador de pendências
- [ ] Adicionar indicador de conexão WebSocket
- [ ] Mostrar toast quando reconectar
- [ ] Commit: `feat: add WebSocket notifications and indicators`

---

### Dia 16: Simplificar Gestão de Estoque

**Decisão:** Escolher entre:

- **Opção A:** Apenas estoque direto (mais simples)
- **Opção B:** Apenas ingredientes (mais completo)

**Checklist (Opção A - Recomendada):**

- [ ] Remover modelo `Ingredient` e `ProductIngredient` do schema
- [ ] Simplificar `Product` para ter apenas `stockQuantity`
- [ ] Atualizar lógica de validação em `OrdersService`
- [ ] Remover tela `/stock` do frontend
- [ ] Adicionar controle de estoque direto em `/products`
- [ ] Criar migration
- [ ] Commit: `refactor: simplify stock management`

---

### Dia 17-18: Dashboard com Métricas

**Checklist:**

- [ ] Criar endpoint `/api/reports/live-metrics`
- [ ] Implementar queries agregadas (count, sum)
- [ ] Adicionar cache de 30s nas métricas
- [ ] Criar componente de cards de métricas no Dashboard
- [ ] Adicionar gráfico de vendas (últimos 7 dias)
- [ ] Atualizar métricas via WebSocket
- [ ] Commit: `feat: add live metrics dashboard`

**Métricas:**

```typescript
interface LiveMetrics {
  openComandas: number;
  pendingOrders: number;
  todayRevenue: number;
  occupiedTables: number;
  lowStockProducts: number;
}
```

---

### Dia 19: Relatórios Exportáveis

**Checklist:**

- [ ] Instalar: `npm install exceljs pdfmake`
- [ ] Criar serviço de export (PDF e Excel)
- [ ] Adicionar botões de export em Reports
- [ ] Implementar relatórios:
  - [ ] Vendas por período
  - [ ] Produtos mais vendidos
  - [ ] Performance de garçons
  - [ ] Status de estoque
- [ ] Commit: `feat: add exportable reports (PDF/Excel)`

---

## 📅 FASE 5: TESTES E DEPLOY (Contínuo)

### Semana 4-5: Testes Automatizados

**Checklist:**

- [ ] Configurar Jest já instalado
- [ ] Escrever testes unitários para services:
  - [ ] AuthService
  - [ ] OrdersService
  - [ ] CategoriesService
  - [ ] ProductsService
- [ ] Escrever testes e2e para endpoints críticos:
  - [ ] POST /auth/login
  - [ ] POST /orders
  - [ ] GET /kitchen/orders
- [ ] Configurar CI para rodar testes automaticamente
- [ ] Meta: > 50% coverage
- [ ] Commit: `test: add unit and e2e tests`

**Executar:**

```bash
# Backend
cd backend
npm test
npm run test:cov

# Configurar threshold em jest.config.js
coverageThreshold: {
  global: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
}
```

---

### Semana 5-6: Preparar Deploy

**Checklist:**

- [ ] Configurar variáveis de ambiente de produção
- [ ] Testar build de produção local
- [ ] Configurar healthcheck endpoints
- [ ] Configurar logs estruturados (Winston/Pino)
- [ ] Configurar monitoramento (Sentry/LogRocket)
- [ ] Testar migração em banco staging
- [ ] Deploy em staging
- [ ] Smoke tests em staging
- [ ] Deploy em produção
- [ ] Commit: `chore: production deployment setup`

---

## 📊 MÉTRICAS DE SUCESSO

### Checkpoints

**Fase 1 - Limpeza:**

- ✅ Redução de 20%+ em linhas de código
- ✅ Redução de 10%+ em dependências
- ✅ Build time < 6 segundos

**Fase 2 - Segurança:**

- ✅ 0 endpoints sem validação
- ✅ Rate limiting ativo em todas as rotas
- ✅ 0 vulnerabilidades críticas (npm audit)

**Fase 3 - Performance:**

- ✅ Queries em cache < 10ms
- ✅ Bundle frontend < 300KB
- ✅ Queries com índices < 50ms (p95)

**Fase 4 - UX:**

- ✅ Todas as ações têm loading state
- ✅ Erros têm mensagens claras
- ✅ Feedback visual em tempo real

**Fase 5 - Qualidade:**

- ✅ > 50% test coverage
- ✅ 0 erros em produção (primeira semana)
- ✅ CI/CD funcionando

---

## 🚨 RISCOS E MITIGAÇÃO

### Risco 1: Breaking Changes no Schema

**Probabilidade:** Alta  
**Impacto:** Alto

**Mitigação:**

- Fazer backup do banco antes de migrations
- Testar migrations em staging primeiro
- Manter migrations reversíveis
- Documentar cada mudança

---

### Risco 2: Cache Inconsistente

**Probabilidade:** Média  
**Impacto:** Médio

**Mitigação:**

- Sempre invalidar cache em updates/deletes
- Usar TTL curto (5min) inicialmente
- Implementar comando para limpar cache manualmente
- Monitorar cache hit rate

---

### Risco 3: WebSocket com Produção

**Probabilidade:** Média  
**Impacto:** Alto

**Mitigação:**

- Implementar fallback para polling
- Adicionar retry automático
- Implementar heartbeat/ping-pong
- Configurar timeout adequado
- Usar Redis Adapter para múltiplas instâncias

---

## ✅ CHECKLIST FINAL

Antes de considerar o refactoring completo:

- [ ] Todos os testes passando
- [ ] Build de produção funciona
- [ ] Documentação atualizada
- [ ] Variáveis de ambiente documentadas
- [ ] Migrations testadas
- [ ] Cache invalidation funcionando
- [ ] Rate limiting testado
- [ ] WebSocket estável
- [ ] Lazy loading implementado
- [ ] Métricas implementadas
- [ ] Relatórios exportáveis
- [ ] Deploy em staging bem-sucedido
- [ ] Smoke tests em staging passando
- [ ] Monitoria configurada
- [ ] Logs estruturados
- [ ] Rollback plan documentado

---

## 📞 SUPORTE PÓS-IMPLEMENTAÇÃO

### Semana 1 após deploy:

- Monitorar logs diariamente
- Verificar métricas de performance
- Coletar feedback de usuários
- Hotfix se necessário

### Semana 2-4:

- Análise de performance real
- Ajustes de cache TTL
- Otimizações baseadas em uso real
- Implementar features fase 2

---

## 📚 DOCUMENTAÇÃO COMPLEMENTAR

Após conclusão, criar:

- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Guia de desenvolvimento
- [ ] Troubleshooting guide
- [ ] Performance guide
- [ ] Security best practices

---

**Início Planejado:** A definir  
**Conclusão Estimada:** 6-8 semanas  
**Esforço:** 1-2 desenvolvedores full-time

**Boa sorte! 🚀**
