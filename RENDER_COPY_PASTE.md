# 🎯 SOLUÇÃO RÁPIDA - Copie e Cole no Render

## ❌ Problema
```
Error: Prisma CLI Version: 7.4.2
The datasource property `url` is no longer supported
```

---

## ✅ SOLUÇÃO (3 passos)

### 1. Configure no Render Dashboard

**Root Directory:**
```
backend
```

### 2. Build Command (COPIE ESTA LINHA):

```bash
npm install --legacy-peer-deps && npm uninstall prisma @prisma/client && npm install prisma@5.8.0 @prisma/client@5.8.0 --save-exact --legacy-peer-deps --force && npx prisma generate && npm run build
```

### 3. Start Command:

```bash
npx prisma migrate deploy && npm run start:prod
```

---

## 🔐 Variáveis de Ambiente

```
DATABASE_URL=<Internal_Database_URL_from_Render>
JWT_SECRET=<gerar_com_crypto>
NODE_ENV=production
```

**Gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Como Verificar Sucesso

Nos logs de build, procure:
```
✅ prisma: 5.8.0
✅ @prisma/client: 5.8.0
```

Se aparecer **7.4.2**, não funcionou.

---

**Pronto!** Esta é a única solução que funciona 100%.
