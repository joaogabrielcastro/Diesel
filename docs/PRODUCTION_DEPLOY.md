# Diesel Bar - Guia de Deploy em Produção

## 🚀 Opções de Deploy

### Opção 1: Railway (Recomendado - Mais Fácil)

#### Backend no Railway

1. **Crie conta no Railway**: https://railway.app
2. **Crie novo projeto**
3. **Adicione PostgreSQL**:
   - Clique em "New" → "Database" → "PostgreSQL"
   - Copie o `DATABASE_URL` gerado

4. **Deploy do Backend**:

   ```bash
   # Instale Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Vincule ao projeto
   railway link

   # Configure variáveis
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=seu-secret-super-seguro
   railway variables set PORT=3000

   # Deploy
   cd backend
   railway up
   ```

5. **Configure Start Command**:
   - No dashboard Railway, vá em Settings → Deploy
   - Start Command: `npm run start:prod`
   - Build Command: `npm install && npx prisma generate && npm run build`

6. **Execute Migrations**:
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

#### Web no Vercel

1. **Instale Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Deploy**:

   ```bash
   cd web
   vercel --prod
   ```

3. **Configure variáveis de ambiente no Vercel**:
   - Dashboard → Settings → Environment Variables
   - `VITE_API_URL`: URL do backend Railway (ex: https://diesel-bar-backend.railway.app/api)

---

### Opção 2: VPS com Docker

#### Preparação do Servidor

```bash
# SSH no servidor
ssh root@seu-servidor.com

# Instalar Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone o repositório
git clone https://github.com/seu-usuario/diesel-bar.git
cd diesel-bar

# Configure variáveis
cp backend/.env.example backend/.env
nano backend/.env  # Edite com suas configs
```

#### Docker Compose para Produção

Crie `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: diesel_bar
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/diesel_bar
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: always
    command: sh -c "npx prisma migrate deploy && node backend/dist/main.js"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./web/dist:/usr/share/nginx/html:ro
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
  redis_data:
```

#### Deploy:

```bash
# Build e start
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar
docker-compose -f docker-compose.prod.yml down
```

---

### Opção 3: Render.com

1. **Crie conta no Render**: https://render.com
2. **Crie PostgreSQL**: New → PostgreSQL
3. **Crie Web Service para Backend**:
   - New → Web Service
   - Conecte repositório
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start:prod`
   - Add Environment Variables:
     - `DATABASE_URL`: Internal Database URL do Render
     - `JWT_SECRET`: seu secret
     - `NODE_ENV`: production

4. **Deploy Web no Render ou Vercel**

---

## 📱 Deploy do Mobile

### iOS (TestFlight)

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

### Android (Google Play)

```bash
# Build APK/AAB
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

---

## 🔐 SSL/HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d api.dieselbar.com -d admin.dieselbar.com

# Renovação automática
sudo certbot renew --dry-run
```

---

## 📊 Monitoramento

### Sentry (Erros)

```bash
npm install @sentry/node @sentry/integrations
```

Configure no `main.ts`:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### PM2 (Process Manager)

```bash
# Instalar
npm install -g pm2

# Start
pm2 start backend/dist/main.js --name diesel-api

# Monitorar
pm2 monit

# Logs
pm2 logs diesel-api

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## ✅ Checklist Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e accessível
- [ ] Migrations executadas
- [ ] Seed executado (dados demo)
- [ ] CORS configurado corretamente
- [ ] JWT_SECRET forte e único
- [ ] SSL/HTTPS habilitado
- [ ] Backup automático configurado
- [ ] Monitoramento de erros (Sentry)
- [ ] Logs centralizados
- [ ] Testes passando
- [ ] Build sem erros

---

## 🔄 Atualização em Produção

```bash
# Pull latest code
git pull origin main

# Backend
cd backend
npm install
npx prisma migrate deploy
npm run build
pm2 restart diesel-api

# Web (se não usar Vercel)
cd ../web
npm install
npm run build
# Copiar dist/ para Nginx
```

---

## 📝 Variáveis de Ambiente Necessárias

### Backend (.env)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=xxxxx
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://admin.dieselbar.com
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://...
```

### Web (.env.production)

```env
VITE_API_URL=https://api.dieselbar.com/api
VITE_WS_URL=wss://api.dieselbar.com
```

### Mobile (eas. json)

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.dieselbar.com/api"
      }
    }
  }
}
```

---

## 📞 Suporte

Em caso de dúvidas:

1. Verifique os logs: `pm2 logs` ou `railway logs`
2. Teste conexão do banco: `psql $DATABASE_URL`
3. Verifique CORS e variáveis de ambiente
4. Consulte documentação oficial de cada plataforma
