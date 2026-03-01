# 🍺 Diesel Bar - Sistema SaaS para Gestão de Bares

Sistema completo de gestão para bares, restaurantes e casas noturnas com foco em mobile-first, tempo real e modo offline.

## 🚀 Tecnologias

### Backend

- Node.js 20+ com NestJS
- TypeScript
- PostgreSQL + Prisma ORM
- Redis para cache e sessões
- Socket.io para real-time
- Bull para filas
- JWT para autenticação

### Mobile (Garçom/Cassino)

- React Native + Expo
- TypeScript
- TanStack Query
- Zustand para state
- Socket.io client

### Web Admin

- React 18 + Vite
- TypeScript
- TanStack Query + Table
- Tailwind CSS + shadcn/ui
- Socket.io client

## 📁 Estrutura do Projeto

```
diesel-bar/
├── backend/          # API NestJS
├── mobile/           # App React Native
├── web/              # Dashboard Admin
├── docs/             # Documentação
└── docker/           # Docker configs
```

## 🏁 Quick Start

### Requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional)

### Instalação

```bash
# Clonar e instalar dependências
npm install

# Setup backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev

# Iniciar backend
npm run start:dev

# Setup mobile
cd ../mobile
npm install
npx expo start

# Setup web
cd ../web
npm install
npm run dev
```

## 📖 Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment](docs/DEPLOYMENT.md)

## 🎯 Funcionalidades

- ✅ Pedidos em tempo real
- ✅ Gestão de mesas e comandas
- ✅ Controle de estoque
- ✅ Painel da cozinha (KDS)
- ✅ Sistema de cassino
- ✅ Modo offline
- ✅ Múltiplas formas de pagamento
- ✅ Relatórios e analytics
- ✅ Multi-tenant

## 📄 Licença

MIT License - Diesel Bar © 2026
