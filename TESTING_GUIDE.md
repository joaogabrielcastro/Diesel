# 🧪 GUIA DE TESTES - DIESEL BAR SYSTEM

## 📋 PRÉ-REQUISITOS

Antes de iniciar os testes, certifique-se de que:

- ✅ PostgreSQL rodando (Neon)
- ✅ Backend NestJS rodando na porta 3000
- ✅ Frontend React rodando na porta 5173
- ✅ Node.js v20+ instalado
- ✅ Expo CLI instalado (mobile)

---

## 🌐 TESTE 1: REPORTS & ANALYTICS (WEB)

### Iniciar Servidores:

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd web
npm run dev
```

### Passos de Teste:

1. **Acessar Dashboard**
   - URL: http://localhost:5173/reports
   - Login: Use suas credenciais
2. **Testar Date Range Picker**
   - Selecionar data inicial: 01/02/2026
   - Selecionar data final: 01/03/2026
   - Verificar se gráficos atualizam

3. **Validar Gráficos**
   - [ ] Gráfico de Receita Diária (LineChart)
   - [ ] Top 8 Produtos (BarChart)
   - [ ] Status dos Pedidos (PieChart)
   - [ ] Horários de Pico (BarChart)

4. **Verificar Stat Cards**
   - [ ] Total de Pedidos mostra número correto
   - [ ] Receita Total formatada em R$
   - [ ] Ticket Médio calculado (receita/pedidos)

5. **Testar Tabela de Produtos**
   - [ ] Lista todos os produtos vendidos
   - [ ] Ordenação por quantidade
   - [ ] Colunas: Rank, Produto, Categoria, Quantidade, Receita, Pedidos

### ✅ Critérios de Sucesso:

- Gráficos carregam sem erro
- Dados refletem período selecionado
- Hover mostra tooltips corretos
- Responsivo em mobile (testar com F12 → Device Toolbar)

---

## 📦 TESTE 2: GESTÃO DE ESTOQUE (WEB)

### Acessar:

- URL: http://localhost:5173/stock

### Passos de Teste:

#### **Aba "Todos os Produtos"**

1. **Visualizar Lista**
   - [ ] Todos os ingredientes aparecem
   - [ ] Colunas: Nome, Unidade, Estoque Atual, Mínimo
   - [ ] Status badge colorizado (verde/amarelo/vermelho)

2. **Testar Movimentação IN**
   - Clicar botão "IN" em um produto
   - Digitar quantidade (ex: 10)
   - Digitar motivo (ex: "Compra fornecedor")
   - Confirmar
   - [ ] Estoque atual aumentou
   - [ ] Toast de sucesso apareceu

3. **Testar Movimentação OUT**
   - Clicar botão "OUT" em um produto
   - Digitar quantidade (ex: 5)
   - Digitar motivo (ex: "Uso cozinha")
   - Confirmar
   - [ ] Estoque atual diminuiu
   - [ ] Toast de sucesso apareceu

#### **Aba "Alertas"**

1. **Verificar Seções**
   - [ ] Crítico (vermelho): Produtos com estoque = 0
   - [ ] Alerta (amarelo): Produtos com ≤50% do mínimo
   - [ ] Atenção (azul): Produtos no estoque mínimo

2. **Testar Reabastecer Rápido**
   - Clicar "Reabastecer" em produto crítico
   - [ ] Abre modal de movimentação IN
   - [ ] Após confirmar, produto sai da lista crítica

#### **Aba "Previsões"**

1. **Analisar Dados Preditivos**
   - [ ] Coluna "Consumo/dia" mostra média
   - [ ] Coluna "Dias Restantes" calculada
   - [ ] Coluna "Sugestão de Compra" mostra quantidade
   - [ ] Cores por urgência:
     - Vermelho: < 3 dias
     - Amarelo: < 7 dias
     - Verde: ≥ 7 dias

2. **Validar Cálculo**
   - Pegar um produto
   - Consumo diário = Total consumido (30 dias) / 30
   - Dias restantes = Estoque atual / Consumo diário
   - Sugestão = (Consumo \* 14) - Estoque atual
   - [ ] Cálculos conferem

### ✅ Critérios de Sucesso:

- Movimentações atualizam em tempo real
- Alertas refletem estado atual
- Previsões são precisas
- UI responsiva e sem travamentos

---

## 📱 TESTE 3: MOBILE OFFLINE

### Pré-requisitos:

```bash
cd mobile
npm install
npx expo start
```

### No Simulador/Device:

#### **Teste 3.1: Carregar Dados Online**

1. **Abrir Aplicativo**
   - [ ] NetworkStatus não aparece (modo online)
2. **Navegar por Categorias**
   - [ ] Categorias carregam do servidor
   - [ ] Produtos carregam do servidor
   - [ ] Dados salvos em SQLite local

3. **Verificar Cache**
   ```tsx
   // No código, conferir:
   await cacheService.get("categories");
   await databaseService.getCategories();
   ```

#### **Teste 3.2: Simular Modo Offline**

**iOS Simulator:**

```
Settings → Developer → Network Link Conditioner → Enable → 100% Loss
```

**Android Emulator:**

```
Settings → Network & Internet → Airplane mode ON
```

**Ou no código:**

```bash
# Terminal DevTools
# Desabilitar rede temporariamente
```

#### **Teste 3.3: Operações Offline**

1. **Navegar por Produtos**
   - [ ] Categorias carregam do cache local
   - [ ] Produtos carregam do SQLite
   - [ ] NetworkStatus vermelho aparece
   - [ ] Mensagem: "Modo Offline"

2. **Criar Pedido Offline**
   - Adicionar produtos ao carrinho
   - Finalizar pedido
   - [ ] Pedido salvo localmente
   - [ ] ID temporário gerado (`offline_timestamp_random`)
   - [ ] NetworkStatus mostra "1 pendência"

3. **Criar Múltiplos Pedidos**
   - Criar mais 2 pedidos
   - [ ] NetworkStatus mostra "3 pendências"

#### **Teste 3.4: Sincronização Automática**

1. **Restaurar Conexão**
   - **iOS**: Desabilitar Network Link Conditioner
   - **Android**: Airplane mode OFF

2. **Validar Sync**
   - [ ] NetworkStatus muda para amarelo "Sincronizando..."
   - [ ] Contador diminui: 3 → 2 → 1 → 0
   - [ ] NetworkStatus desaparece
   - [ ] Pedidos aparecem no backend

3. **Verificar Backend**
   ```bash
   # GET /api/orders
   # Conferir se os 3 pedidos offline foram criados
   ```

#### **Teste 3.5: Falha de Sync**

1. **Criar Pedido com Dados Inválidos**
   - Ex: comandaId inexistente
   - [ ] Falha na primeira tentativa
   - [ ] SyncService tenta novamente
   - [ ] Após 3 falhas, mantém na fila

2. **Verificar Logs**
   ```tsx
   console.log("Sync failed, will retry...");
   ```

### ✅ Critérios de Sucesso:

- App funciona completamente offline
- Dados são cachados corretamente
- Sincronização automática funciona
- UI mostra feedback claro do status
- Sem crashes ou perda de dados

---

## 🔬 TESTE 4: ENDPOINTS BACKEND (API)

### Pré-requisitos:

- Postman instalado ou usar `curl`
- Backend rodando na porta 3000
- Token JWT válido

### Autenticação:

```bash
# Fazer login
POST http://localhost:3000/api/auth/login
{
  "email": "admin@diesel.com",
  "password": "senha123"
}

# Copiar token da resposta
```

### Testar Reports API:

#### 1. Sales Report

```bash
GET http://localhost:3000/api/reports/sales?startDate=2026-02-01&endDate=2026-03-01
Headers: Authorization: Bearer {token}

# ✅ Espera-se:
{
  "totalOrders": 150,
  "totalRevenue": 4500.00,
  "averageOrderValue": 30.00
}
```

#### 2. Top Selling Products

```bash
GET http://localhost:3000/api/reports/products/top-selling?startDate=2026-02-01&endDate=2026-03-01&limit=10
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Array de 10 produtos ordenados por quantidade
```

#### 3. Revenue Report (Grouped by Day)

```bash
GET http://localhost:3000/api/reports/revenue?startDate=2026-02-01&endDate=2026-03-01&groupBy=day
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Array com receita por dia
```

#### 4. Orders Status Distribution

```bash
GET http://localhost:3000/api/reports/orders/status?startDate=2026-02-01&endDate=2026-03-01
Headers: Authorization: Bearer {token}

# ✅ Espera-se: { PENDING: 20, PREPARING: 15, READY: 10, DELIVERED: 100, CANCELLED: 5 }
```

#### 5. Peak Hours

```bash
GET http://localhost:3000/api/reports/peak-hours?startDate=2026-02-01&endDate=2026-03-01
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Array de 24 elementos (0h-23h)
```

#### 6. Dashboard Stats

```bash
GET http://localhost:3000/api/reports/dashboard
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Métricas do dia atual
```

### Testar Stock API:

#### 1. Get All Stock

```bash
GET http://localhost:3000/api/stock
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Array com todos os ingredientes
```

#### 2. Get Low Stock Only

```bash
GET http://localhost:3000/api/stock?lowStock=true
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Apenas produtos com estoque baixo
```

#### 3. Get Stock Alerts

```bash
GET http://localhost:3000/api/stock/alerts
Headers: Authorization: Bearer {token}

# ✅ Espera-se:
{
  "products": {
    "critical": [...],
    "warning": [...],
    "attention": [...]
  }
}
```

#### 4. Get Stock Predictions

```bash
GET http://localhost:3000/api/stock/predictions
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Array com previsões calculadas
```

#### 5. Create Stock Movement

```bash
POST http://localhost:3000/api/stock/movement
Headers: Authorization: Bearer {token}
Body:
{
  "productId": "ingredient-uuid",
  "quantity": 10,
  "type": "IN",
  "reason": "Compra fornecedor"
}

# ✅ Espera-se: Movimento criado + estoque atualizado
```

#### 6. Get Stock Movements History

```bash
GET http://localhost:3000/api/stock/movements?startDate=2026-02-01&endDate=2026-03-01
Headers: Authorization: Bearer {token}

# ✅ Espera-se: Últimas 100 movimentações
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Problema: Backend não inicia

```bash
# Verificar porta 3000
netstat -ano | findstr :3000

# Matar processo
taskkill /PID <PID> /F

# Reiniciar
npm run start:dev
```

### Problema: Frontend não carrega dados

```bash
# Verificar se backend está rodando
curl http://localhost:3000/api/reports/dashboard

# Verificar token no localStorage
# DevTools → Application → Local Storage → token
```

### Problema: Mobile não sincroniza

```typescript
// Limpar fila manualmente
import { syncService } from "./services/sync";
await syncService.clearQueue();

// Forçar sync
await syncService.syncPendingActions();
```

### Problema: Expo não inicia

```bash
# Limpar cache
npx expo start -c

# Reinstalar dependências
rm -rf node_modules
npm install
```

---

## 📊 CHECKLIST FINAL

### Backend:

- [ ] Compilação sem erros TypeScript
- [ ] 6 endpoints Reports funcionando
- [ ] 7 endpoints Stock funcionando
- [ ] Autenticação JWT funcionando
- [ ] Database conectado

### Frontend Web:

- [ ] Build production sem erros
- [ ] Reports page carregando
- [ ] Stock page funcionando
- [ ] Gráficos renderizando
- [ ] Responsivo mobile

### Mobile:

- [ ] Expo rodando sem erros
- [ ] NetworkStatus component aparece
- [ ] Modo offline funcional
- [ ] SQLite database criado
- [ ] Sincronização automática
- [ ] Cache funcionando

---

## ✅ CONCLUSÃO DOS TESTES

Se todos os testes passaram:

**🎉 Sistema 100% funcional e pronto para produção!**

Próximos passos:

1. Deploy backend (Railway/Render/Heroku)
2. Deploy frontend (Vercel/Netlify)
3. Build mobile (EAS Build)
4. Testes com usuários reais
5. Monitoramento em produção

---

**Desenvolvido com ❤️ usando GitHub Copilot**
