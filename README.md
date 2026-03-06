# 🍺 Diesel Bar - Sistema de Gestão para Restaurantes e Bares

Sistema completo de gestão para restaurantes, bares e lanchonetes com controle de pedidos em tempo real, gestão de estoque, relatórios financeiros e interface bilíngue (Português/Inglês).

## ✨ Funcionalidades Principais

### 🎯 Gestão Operacional

- **Controle de Mesas** - Gerenciamento visual do status de todas as mesas
- **Pedidos em Tempo Real** - Sistema de pedidos com WebSocket para atualizações instantâneas
- **Comandas Digitais** - Abertura, adição de itens e fechamento de comandas
- **Gestão de Cozinha** - Visualização de pedidos pendentes com controle de status

### 💰 Financeiro

- **Múltiplas Formas de Pagamento** - Dinheiro, Cartão (Crédito/Débito) e PIX
- **Relatórios Detalhados** - Faturamento diário, produtos mais vendidos, horários de pico
- **Dashboard em Tempo Real** - Métricas atualizadas automaticamente
- **Histórico Completo** - Registro de todas as transações e pedidos

### 📦 Estoque

- **Controle de Ingredientes** - Cadastro de ingredientes por tipo (Alimento, Bebida, Outro)
- **Alertas Inteligentes** - Notificações de estoque crítico, baixo e acabando
- **Movimentações** - Registro de entradas e saídas com motivos
- **Previsões de Consumo** - Análise de consumo para planejamento de compras

### 👥 Gestão de Usuários

- **Múltiplos Perfis**
  - **Admin**: Acesso completo ao sistema
  - **Garçom**: Mesas, pedidos e pagamentos
  - **Cozinha**: Visualização e controle de pedidos
- **Controle de Permissões** - Acesso baseado em perfil
- **Multi-usuário** - Vários usuários trabalhando simultaneamente

### 🌐 Internacionalização

- **Português e Inglês** - Interface completamente traduzida
- **Troca em Tempo Real** - Alternância de idioma sem reload
- **Todos os Perfis** - Admin, garçom e cozinha podem escolher seu idioma

## 🛠️ Tecnologias Utilizadas

### Backend

- **NestJS** - Framework Node.js robusto e escalável
- **Prisma ORM** - ORM moderno e type-safe
- **PostgreSQL** - Banco de dados relacional
- **WebSocket** - Comunicação em tempo real
- **JWT** - Autenticação segura
- **bcryptjs** - Hash de senhas

### Frontend

- **React 18** - Biblioteca UI moderna
- **TypeScript** - Type safety em todo o código
- **Vite** - Build tool ultra-rápido
- **TanStack Query** - Gerenciamento de estado servidor
- **Zustand** - Gerenciamento de estado cliente
- **Recharts** - Gráficos e visualizações
- **Tailwind CSS** - Estilização utility-first
- **Socket.io Client** - WebSocket client

## 📁 Estrutura do Projeto

```
diesel/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Autenticação JWT
│   │   ├── users/          # Gestão de usuários
│   │   ├── establishments/ # Estabelecimentos
│   │   ├── products/       # Produtos do cardápio
│   │   ├── categories/     # Categorias de produtos
│   │   ├── tables/         # Controle de mesas
│   │   ├── comandas/       # Sistema de comandas
│   │   ├── orders/         # Pedidos
│   │   ├── payments/       # Processamento de pagamentos
│   │   ├── stock/          # Gestão de estoque
│   │   └── reports/        # Relatórios e analytics
│   └── prisma/
│       ├── schema.prisma   # Schema do banco
│       └── seed.ts         # Dados iniciais
│
├── web/                    # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # API clients e WebSocket
│   │   ├── store/          # Zustand stores
│   │   ├── locales/        # Traduções PT/EN
│   │   └── hooks/          # Custom hooks
│   └── public/
│
├── setup.bat               # Script de instalação (Windows)
├── reset-database.bat      # Script para resetar BD
└── SETUP.md               # Guia de instalação completo
```

## 🚀 Instalação Rápida

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Clone o repositório

```bash
git clone <repository-url>
cd diesel
```

### 2. Configure o banco de dados

```sql
CREATE DATABASE diesel_bar;
```

### 3. Configure as variáveis de ambiente

**Backend** - Crie `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/diesel_bar"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3000
```

**Frontend** - Crie `web/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 4. Execute o script de instalação

**Windows:**

```bash
setup.bat
```

**Linux/Mac:**

```bash
# Backend
cd backend
npm install
npm run setup

# Frontend (em outro terminal)
cd web
npm install
```

### 5. Inicie a aplicação

**Backend:**

```bash
cd backend
npm run start:dev
```

**Frontend:**

```bash
cd web
npm run dev
```

Acesse: http://localhost:5173

## 🔄 Resetar Banco de Dados

Para limpar todos os dados e recomeçar:

**Windows:**

```bash
reset-database.bat
```

**Linux/Mac:**

```bash
cd backend
npm run db:fresh
```

## 📖 Documentação Completa

Consulte [SETUP.md](SETUP.md) para instruções detalhadas de instalação, configuração e troubleshooting.

## 🎨 Features Destacadas

### Dashboard Inteligente

- Métricas em tempo real (pedidos hoje, mesas ativas, faturamento)
- Gráficos de crescimento
- Lista de pedidos recentes com status
- Visualização do status de todas as mesas

### Sistema de Pedidos

- Interface intuitiva para seleção de produtos
- Carrinho de compras com cálculo automático
- Observações personalizadas
- Validação de estoque em tempo real
- Notificações para a cozinha via WebSocket

### Relatórios Avançados

- Faturamento diário com gráficos
- Top produtos mais vendidos
- Análise de horários de pico
- Status dos pedidos em gráfico de pizza
- Detalhamento por produto com categoria
- Filtros por período (hoje, semana, mês, customizado)

### Gestão de Estoque Profissional

- Três níveis de alerta (Crítico, Baixo, Acabando)
- Categorização por tipo (Alimento, Bebida, Outro)
- Movimentações rastreáveis
- Previsão de consumo baseada em histórico
- Integração com pedidos para baixa automática

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Senhas hasheadas com bcrypt
- Validação de inputs em todas as rotas
- Rate limiting para prevenir abuse
- CORS configurado
- SQL Injection protection via Prisma

## 📱 Responsividade

Interface totalmente responsiva que funciona perfeitamente em:

- Desktop (1920x1080+)
- Tablets (768x1024)
- Smartphones (375x667)

## 🌟 Próximas Melhorias

- [ ] App Mobile (React Native)
- [ ] Impressão de comandas e cupons fiscais
- [ ] Integração com sistemas de pagamento (Mercado Pago, PagSeguro)
- [ ] Sistema de delivery
- [ ] Programa de fidelidade
- [ ] Analytics avançado com BI
- [ ] Backup automático
- [ ] Tema escuro/claro

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

## 👥 Equipe

Desenvolvido por Diesel Bar Team

---

**Versão:** 1.0.0  
**Última atualização:** 2025

MIT License - Diesel Bar © 2026
