# 🚀 Guia de Deploy Correto no Render

## ❌ Problema Encontrado

O Render estava instalando **Prisma 7.x** (versão beta com breaking changes), mas o projeto usa **Prisma 5.8.0** (estável).

## ✅ Solução Implementada

### 1. Versões Fixadas no `package.json`

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "overrides": {
    "prisma": "5.8.0",
    "@prisma/client": "5.8.0"
  },
  "dependencies": {
    "@prisma/client": "5.8.0" // Sem ^ (versão exata)
  },
  "devDependencies": {
    "prisma": "5.8.0" // Sem ^ (versão exata)
  }
}
```

### 2. Arquivo `.npmrc` Criado

Criado em `backend/.npmrc`:

```
save-exact=true
engine-strict=true
legacy-peer-deps=true
```

---

## 🔧 Configurações Corretas do Render

### **1. Criar PostgreSQL Database**

- New → PostgreSQL
- Name: `diesel-db`
- Plan: Free (ou pago)
- Copie a **Internal Database URL**

### **2. Configurar Web Service**

#### **Settings:**

- **Name:** Diesel
- **Runtime:** Node
- **Region:** Ohio (US East)
- **Branch:** main
- **Root Directory:** `backend`

#### **Build Command:**

```bash
npm install --legacy-peer-deps && npx prisma generate && npm run build
```

#### **Start Command:**

```bash
npx prisma migrate deploy && npm run start:prod
```

> ⚠️ **IMPORTANTE:** Incluir `npx prisma migrate deploy` no Start Command para rodar migrations automaticamente

---

## 🔐 Environment Variables (Render)

Configure estas variáveis no Render Dashboard:

```env
# Database
DATABASE_URL=<Internal_Database_URL_do_Render>

# Authentication
JWT_SECRET=<gere_uma_string_aleatoria_segura>
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=3000

# CORS - URLs do frontend
CORS_ORIGIN=https://seu-dominio.vercel.app,https://seu-app.com

# Redis (opcional - se precisar)
REDIS_URL=redis://...
```

### 🔑 Gerar JWT_SECRET Seguro:

No terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📋 Checklist de Deploy

Antes de fazer deploy:

- [x] Versões do Prisma fixadas em `5.8.0`
- [x] Arquivo `.npmrc` criado
- [x] `engines` definido no `package.json`
- [x] Build command com `--legacy-peer-deps`
- [x] Start command com `prisma migrate deploy`
- [ ] PostgreSQL criado no Render
- [ ] Environment variables configuradas
- [ ] `DATABASE_URL` apontando para Internal Database URL
- [ ] `JWT_SECRET` gerado e configurado
- [ ] `CORS_ORIGIN` com URLs corretas

---

## 🐛 Troubleshooting

### Problema: "Prisma schema validation error P1012"

**Causa:** Render instalou Prisma 7.x  
**Solução:** ✅ Já corrigido com versões fixadas

### Problema: "Cannot find module @prisma/client"

**Causa:** Faltou `npx prisma generate` no build  
**Solução:** Build command deve ter `npx prisma generate`

### Problema: "No migrations found"

**Causa:** Migrations não foram rodadas  
**Solução:** Start command deve ter `npx prisma migrate deploy`

### Problema: "Port already in use"

**Causa:** Render não encontra a variável PORT  
**Solução:** Render injeta automaticamente, mas defina PORT=3000 no .env

### Problema: "Module not found" após deploy

**Causa:** Dependencies não instaladas corretamente  
**Solução:** Use `npm ci` ao invés de `npm install` no build command

---

## 🎯 Build Command Recomendado (Final)

```bash
npm ci --legacy-peer-deps && npx prisma generate && npm run build
```

**Diferenças:**

- `npm ci` → Mais rápido e confiável que `npm install`
- `--legacy-peer-deps` → Resolve conflitos de peer dependencies
- `npx prisma generate` → Gera o cliente Prisma
- `npm run build` → Compila o TypeScript

---

## 🌐 URLs de Produção

Após o deploy:

- **Backend API:** `https://diesel-xxx.onrender.com/api`
- **Health Check:** `https://diesel-xxx.onrender.com/api/auth/login`
- **Swagger Docs:** `https://diesel-xxx.onrender.com/api/docs` (se configurado)

---

## 📊 Próximos Passos

1. ✅ Fazer commit das alterações no `package.json` e `.npmrc`
2. ✅ Push para GitHub
3. ⏳ Criar Web Service no Render
4. ⏳ Configurar variáveis de ambiente
5. ⏳ Fazer deploy
6. ⏳ Testar endpoints

---

## 🔄 Comandos Git

```bash
# Commit das alterações
git add backend/package.json backend/.npmrc
git commit -m "fix: Fix Prisma version to 5.8.0 for Render deploy"
git push origin main
```

---

## 📞 Suporte

Se encontrar erros, verifique os logs no Render Dashboard:

- **Build Logs:** Logs durante `npm install` e `build`
- **Deploy Logs:** Logs durante o `start` da aplicação

**Logs comuns:**

- ✅ `Prisma schema loaded from prisma/schema.prisma` - OK
- ✅ `Generated Prisma Client` - OK
- ✅ `🚀 Diesel Bar API running on...` - OK
- ❌ `Error: P1012` - Versão errada do Prisma
- ❌ `Error: P1001` - Não conectou no banco

---

**Status:** ✅ Projeto pronto para deploy no Render
**Última atualização:** 02/03/2026
