# 🚀 Deploy do Frontend no Vercel

## 📋 Configuração Passo a Passo

### 1. **Importar do GitHub**

- Repositório: `joaogabrielcastro/Diesel`
- Branch: `main`

### 2. **Project Settings**

| Campo                | Valor                                |
| -------------------- | ------------------------------------ |
| **Project Name**     | `diesel-frontend` (ou escolha outro) |
| **Framework Preset** | Vite                                 |
| **Root Directory**   | `web` ⚠️ IMPORTANTE                  |

### 3. **Build Settings** (clique em "Build and Output Settings")

| Campo                | Valor                  |
| -------------------- | ---------------------- |
| **Build Command**    | `npm run build`        |
| **Output Directory** | `dist`                 |
| **Install Command**  | `npm install` (padrão) |

### 4. **Environment Variables** (clique para expandir)

Adicione esta variável:

```env
VITE_API_URL=https://diesel-0i1m.onrender.com/api
```

⚠️ **IMPORTANTE**: Copie o URL exato do seu backend no Render!

---

## 🔐 Atualizar CORS no Backend (Render)

Após o deploy do Vercel, você receberá a URL do frontend (ex: `https://diesel-frontend.vercel.app`).

### Adicionar Variável no Render:

1. Acesse o **Dashboard do Render**
2. Vá em **Services → diesel → Environment**
3. Adicione ou atualize:

```env
CORS_ORIGIN=https://diesel-frontend.vercel.app,http://localhost:5173
```

⚠️ **Substitua** `diesel-frontend` pelo nome real que o Vercel gerou!

4. Clique em **Save Changes** (o serviço vai reiniciar automaticamente)

---

## ✅ Checklist

- [ ] Código atualizado com `VITE_API_URL` no api.ts
- [ ] Commit e push das alterações
- [ ] Root Directory configurado como `web` no Vercel
- [ ] Variável `VITE_API_URL` adicionada no Vercel
- [ ] Deploy iniciado no Vercel
- [ ] URL do Vercel obtida após deploy
- [ ] `CORS_ORIGIN` atualizado no Render com URL do Vercel
- [ ] Backend reiniciado no Render

---

## 🧪 Testar Após Deploy

1. **Frontend**: https://[seu-app].vercel.app
2. **Login**: Use credenciais do seed:
   - Email: `admin@demo.com`
   - Senha: `admin123`

3. **Verificar Console**: Abra DevTools → Console para ver se há erros de CORS

---

## 🔧 Troubleshooting

### Erro: "Network Error" ou "Failed to fetch"

- ✅ Verifique se `VITE_API_URL` está correto no Vercel
- ✅ Verifique se o backend está online no Render
- ✅ Teste a API diretamente: https://diesel-0i1m.onrender.com/api

### Erro de CORS

- ✅ Adicione a URL do Vercel na variável `CORS_ORIGIN` no Render
- ✅ Reinicie o serviço no Render após adicionar
- ✅ Aguarde 1-2 minutos para propagar

### Build falhou no Vercel

- ✅ Verifique se **Root Directory** está como `web`
- ✅ Verifique os logs de build no Vercel
- ✅ Certifique-se que commitou as alterações

---

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. Configure domínio customizado (opcional)
2. Configure Analytics do Vercel (opcional)
3. Configure Vercel Speed Insights (opcional)
