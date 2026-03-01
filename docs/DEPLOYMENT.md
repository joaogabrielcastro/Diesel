# Guia de Deploy - Diesel Bar

## Deploy em Produção

### Opção 1: VPS (DigitalOcean, AWS EC2, Linode)

#### 1. Preparar o Servidor

```bash
# Ubuntu 22.04 LTS
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar nginx
sudo apt install nginx -y

# Instalar PM2
sudo npm install -g pm2
```

#### 2. Configurar PostgreSQL

```bash
sudo -u postgres psql

# Criar usuário e banco
CREATE USER dieselbar WITH PASSWORD 'senha_segura';
CREATE DATABASE diesel_bar OWNER dieselbar;
GRANT ALL PRIVILEGES ON DATABASE diesel_bar TO dieselbar;
\q
```

#### 3. Clonar e Configurar Backend

```bash
cd /var/www
git clone <repo-url> diesel-bar
cd diesel-bar/backend

# Instalar dependências
npm install --production

# Configurar .env
nano .env
```

**.env de Produção:**
```env
DATABASE_URL="postgresql://dieselbar:senha_segura@localhost:5432/diesel_bar"
JWT_SECRET=chave_extremamente_segura_e_aleatoria
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://admin.dieselbar.com,https://api.dieselbar.com
```

```bash
# Executar migrations
npx prisma generate
npx prisma migrate deploy

# Build
npm run build

# Iniciar com PM2
pm2 start dist/main.js --name diesel-api
pm2 save
pm2 startup
```

#### 4. Build e Deploy Frontend Web

```bash
cd ../web

# Instalar dependências
npm install

# Build
npm run build

# Copiar build para nginx
sudo cp -r dist/* /var/www/html/
```

#### 5. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/diesel-bar
```

```nginx
# API
server {
    listen 80;
    server_name api.dieselbar.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.dieselbar.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/diesel-bar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Configurar SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y

# Obter certificados
sudo certbot --nginx -d api.dieselbar.com -d admin.dieselbar.com

# Auto-renovação (já configurada)
sudo certbot renew --dry-run
```

---

### Opção 2: Docker + Docker Compose

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: diesel_bar
      POSTGRES_USER: dieselbar
      POSTGRES_PASSWORD: senha_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://dieselbar:senha_segura@postgres:5432/diesel_bar
      REDIS_HOST: redis
      JWT_SECRET: chave_segura
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

#### Web Dockerfile

```dockerfile
# web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Deploy

```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f backend

# Executar migrations
docker-compose exec backend npx prisma migrate deploy

# Seed
docker-compose exec backend npm run prisma:seed
```

---

### Opção 3: Vercel + Railway/Render

#### Backend no Railway

1. Acesse [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Selecione o repositório
4. Configure variáveis de ambiente:
   - `DATABASE_URL` (PostgreSQL do Railway)
   - `JWT_SECRET`
   - `NODE_ENV=production`
5. Railway detecta automaticamente e faz deploy

#### Frontend Web no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Import repositório
3. Configure build:
   - Framework: Vite
   - Root: `web`
   - Build Command: `npm run build`
   - Output: `dist`
4. Variáveis de ambiente:
   - `VITE_API_URL=https://seu-backend.railway.app`
5. Deploy automaticamente

---

## Mobile App - Publicação

### iOS (App Store)

1. **Configurar Apple Developer Account**
2. **Build**:
```bash
cd mobile
eas build --platform ios
```
3. **Submit**:
```bash
eas submit --platform ios
```

### Android (Google Play)

1. **Configurar Google Play Console**
2. **Build**:
```bash
cd mobile
eas build --platform android
```
3. **Submit**:
```bash
eas submit --platform android
```

---

## Checklist Pré-Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] JWT_SECRET é uma chave aleatória forte
- [ ] Senhas do banco são seguras
- [ ] CORS configurado corretamente
- [ ] SSL/HTTPS habilitado
- [ ] Backup automático configurado
- [ ] Monitoring configurado (Sentry, etc)
- [ ] Testes passando
- [ ] Migrations rodadas
- [ ] Seed executado (opcional)

## Monitoramento Pós-Deploy

```bash
# Ver logs do PM2
pm2 logs diesel-api

# Status dos serviços
pm2 status

# Monitorar recursos
pm2 monit

# Logs do nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## Backup

### Backup Manual

```bash
# PostgreSQL
pg_dump -U dieselbar diesel_bar > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U dieselbar diesel_bar < backup_20260301.sql
```

### Backup Automático (Cron)

```bash
crontab -e

# Backup diário às 2h da manhã
0 2 * * * pg_dump -U dieselbar diesel_bar | gzip > /backups/diesel_$(date +\%Y\%m\%d).sql.gz
```

## Segurança

- [ ] Firewall configurado (UFW)
- [ ] Fail2ban instalado
- [ ] SSH com chave pública (desabilitar senha)
- [ ] PostgreSQL aceita apenas localhost
- [ ] Rate limiting configurado
- [ ] Helmet.js no backend
- [ ] CORS restritivo

## Troubleshooting

### Backend não inicia
```bash
# Ver logs
pm2 logs diesel-api --lines 100

# Restart
pm2 restart diesel-api

# Verificar porta
sudo lsof -i :3000
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -U dieselbar -d diesel_bar
```

### SSL não funciona
```bash
# Renovar certificados
sudo certbot renew

# Verificar configuração nginx
sudo nginx -t
```
