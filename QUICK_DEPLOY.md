## 🚀 Deploy Rápido no Render

### ⚡ Solução DEFINITIVA para Prisma 7

** IMPORTANTE:** O Render continua instalando Prisma 7. Use a **configuração manual** abaixo (mais confiável).

---

## 🎯 Deploy em 4 Passos (GARANTIDO)

### 1️⃣ Commit e Push

```bash
git add .
git commit -m "fix: Force Prisma 5.8.0 with uninstall strategy"
git push origin main
```

### 2️⃣ Criar Database no Render

- Acesse [Render Dashboard](https://dashboard.render.com)
- New → PostgreSQL
- Name: `diesel-db`
- Copie o **Internal Database URL**

### 3️⃣ Criar Web Service (MANUAL)

⚠️ **NÃO use render.yaml**. Configure manualmente:

- New → Web Service
- Conecte seu repositório GitHub
- **Root Directory:** `backend`

**Build Command** (copie EXATAMENTE):

```bash
npm install --legacy-peer-deps && npm uninstall prisma @prisma/client && npm install prisma@5.8.0 @prisma/client@5.8.0 --save-exact --legacy-peer-deps --force && npx prisma generate && npm run build
```

**Start Command:**

```bash
npx prisma migrate deploy && npm run start:prod
```

### 4️⃣ Configurar Variáveis

Environment → Add Environment Variable:

- `DATABASE_URL`: Cole a Internal Database URL
- `JWT_SECRET`: Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `NODE_ENV`: `production`

**Deploy!** 🎉

---

## 🐛 Se o Build Falhar

### ❌ Erro: "Prisma CLI Version: 7.4.2"

**Configure manualmente o Build Command:**

```bash
npm install --legacy-peer-deps && npm install prisma@5.8.0 @prisma/client@5.8.0 --save-exact --legacy-peer-deps && npx prisma generate && npm run build
```

### ✅ Verificar Sucesso

Nos logs de build, procure por:

```
prisma: 5.8.0
@prisma/client: 5.8.0
✅ Build completed successfully!
```

---

## 📚 Documentação Completa

Ver [RENDER_DEPLOY_GUIDE.md](RENDER_DEPLOY_GUIDE.md) para instruções detalhadas.

---

**Status:** ✅ Pronto para deploy  
**Versão Prisma:** 5.8.0 (fixado)  
**Node Version:** 20.11.0
