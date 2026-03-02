## 🚀 Deploy Rápido no Render

### ⚡ Solução do Problema Prisma 7

O projeto agora tem **configuração automática** que força Prisma 5.8.0.

### 📦 Arquivos Criados:

- ✅ `render.yaml` - Config automática do Render
- ✅ `backend/build.sh` - Script que força Prisma 5.8.0
- ✅ `backend/.npmrc` - Configurações NPM
- ✅ `backend/package.json` - Versões fixadas

---

## 🎯 Deploy em 3 Passos

### 1️⃣ Commit e Push

```bash
git add .
git commit -m "fix: Add Render config with Prisma 5.8.0"
git push origin main
```

### 2️⃣ Criar Database no Render

- Acesse [Render Dashboard](https://dashboard.render.com)
- New → PostgreSQL
- Name: `diesel-db`
- Copie o **Internal Database URL**

### 3️⃣ Criar Web Service

- New → Web Service
- Conecte seu repositório GitHub
- **Render detecta render.yaml automaticamente** ✅
- Configure apenas estas 2 variáveis:
  - `DATABASE_URL`: Cole a Internal Database URL
  - `JWT_SECRET`: Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Click "Create Web Service"

**Pronto!** 🎉 O Render vai:

1. Instalar dependências
2. Forçar Prisma 5.8.0
3. Gerar Prisma Client
4. Buildar a aplicação
5. Rodar migrations
6. Iniciar o servidor

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
