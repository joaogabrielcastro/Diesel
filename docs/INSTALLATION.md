# Guia de Instalação - Diesel Bar

## Requisitos do Sistema

- Node.js 20 ou superior
- PostgreSQL 15 ou superior
- Redis 7 ou superior (opcional, mas recomendado)
- npm ou yarn

## Instalação Passo a Passo

### 1. Clone o repositório

```bash
git clone <repository-url>
cd diesel-bar
```

### 2. Instale as dependências

```bash
# Instalar dependências de todos os projetos
npm run install:all

# Ou instalar individualmente
cd backend && npm install
cd ../mobile && npm install
cd ../web && npm install
```

### 3. Configure o Backend

```bash
cd backend

# Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env com suas configurações
# Principalmente DATABASE_URL, JWT_SECRET e REDIS_HOST
```

### 4. Configure o PostgreSQL

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE diesel_bar;
```

Ou use Docker:

```bash
docker run --name diesel-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=diesel_bar \
  -p 5432:5432 \
  -d postgres:15
```

### 5. Execute as Migrations

```bash
cd backend

# Gerar o Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate dev

# Popular banco com dados de exemplo
npm run prisma:seed
```

### 6. Inicie o Backend

```bash
cd backend
npm run start:dev
```

O backend estará rodando em `http://localhost:3000`

### 7. Inicie o Frontend Web

Em outro terminal:

```bash
cd web
npm run dev
```

O dashboard web estará em `http://localhost:5173`

### 8. Inicie o App Mobile

Em outro terminal:

```bash
cd mobile
npx expo start
```

Use o app Expo Go no seu celular para escanear o QR Code.

## Credenciais de Demonstração

Após executar o seed, você terá acesso com:

**Admin:**
- Email: `admin@demo.com`
- Senha: `123456`

**Garçom:**
- Email: `garcom@demo.com`
- Senha: `123456`

## Comandos Úteis

### Backend
```bash
npm run start:dev      # Inicia em modo desenvolvimento
npm run build          # Build para produção
npm run start:prod     # Inicia em produção
npm run lint           # Linter
npm run test           # Testes
npm run prisma:studio  # Interface visual do banco
```

### Web
```bash
npm run dev            # Inicia em desenvolvimento
npm run build          # Build para produção
npm run preview        # Preview do build
```

### Mobile
```bash
npx expo start         # Inicia Expo
npx expo start --android   # Abre no Android
npx expo start --ios       # Abre no iOS
```

## Troubleshooting

### Erro de conexão com PostgreSQL
- Verifique se o PostgreSQL está rodando
- Confirme a DATABASE_URL no .env
- Teste a conexão: `psql -U postgres -d diesel_bar`

### Erro ao rodar migrations
```bash
# Resete o banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset
```

### Erro no mobile - Network Request Failed
- Atualize a URL da API no arquivo `mobile/app/services/api.ts`
- Use o IP da sua máquina ao invés de localhost
- Exemplo: `http://192.168.1.100:3000/api`

### Porta já em uso
```bash
# Mate o processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou use outra porta no .env
PORT=3001
```

## Próximos Passos

1. Personalize as configurações em `.env`
2. Configure o Redis para melhor performance
3. Configure SSL para produção
4. Configure backup automático do banco
5. Configure monitoring (Sentry, Datadog)

## Suporte

Para problemas ou dúvidas:
- Abra uma issue no GitHub
- Email: suporte@dieselbar.com
- Documentação: /docs
