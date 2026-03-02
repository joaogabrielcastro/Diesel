# Progressive Web App (PWA) - Diesel Bar

## ✅ Configuração Completa

O sistema web foi convertido em Progressive Web App (PWA), permitindo instalação em dispositivos móveis com funcionalidade offline.

## Características PWA

### 📱 Instalação
- **Android**: Abra no Chrome/Edge → Menu → "Adicionar à tela inicial"
- **iOS**: Abra no Safari → Compartilhar → "Adicionar à Tela Inicial"
- **Desktop**: Aparece ícone de instalação na barra de endereço

### 🔌 Funcionalidade Offline
- Cache inteligente de recursos estáticos (JS, CSS, imagens)
- Cache de API com estratégia NetworkFirst (24h)
- Sincronização automática quando voltar online

### ⚡ Performance
- Carregamento instantâneo após instalação
- Service Worker gerencia cache automaticamente
- Atualização automática em background

## Arquivos PWA

### Manifest (`public/manifest.json`)
Define metadados do app:
- Nome: "Diesel Bar - Sistema de Gestão"
- Ícones: 192x192 e 512x512 px
- Tema: Dark (#1f2937)
- Modo: Standalone (tela cheia, sem navegador)

### Service Worker (Workbox)
Configurado em `vite.config.ts`:
- Cache de assets estáticos
- Cache de API (NetworkFirst, 24h)
- Atualização automática

### Ícones
- `icon-192.png`: 192x192 (Android, iOS)
- `icon-512.png`: 512x512 (Splash screens)
- Gerados por `generate-icons.js` a partir de SVG

## Testar Localmente

```bash
# Build de produção
npm run build

# Servir build e testar PWA
npm run preview
```

Abra em `http://localhost:4173` e verifique:
1. Ícone de instalação aparece no navegador
2. Console mostra "PWA registered successfully"
3. DevTools → Application → Service Workers (status: activated)
4. DevTools → Application → Manifest (sem erros)

## Deploy

### Vercel (Atual)
O PWA já está habilitado automaticamente:
- Push para GitHub → Vercel rebuilda
- Service Worker e manifest servidos estaticamente
- HTTPS obrigatório (PWA só funciona em HTTPS)

### Testar em Produção
1. Acesse https://diesel-web.vercel.app em mobile
2. Aguarde prompt "Adicionar à tela inicial"
3. Instale o app
4. Abra o ícone instalado (abre em tela cheia)

## Cache Strategy

### Assets Estáticos
- **Pattern**: `**/*.{js,css,html,ico,png,svg,woff,woff2}`
- **Strategy**: Cache-first (Workbox padrão)
- **Validade**: Até nova versão do app

### API Calls
- **Pattern**: `https://diesel-0i1m.onrender.com/api/**`
- **Strategy**: NetworkFirst (tenta rede, fallback cache)
- **Cache**: 100 entradas, 24h
- **Respostas**: Status 0 e 200

## Personalizar Ícones

### Opção 1: Regenerar com Logo Customizado
1. Substitua SVGs em `public/icon-*.svg`
2. Execute: `node generate-icons.js`
3. Commit e push

### Opção 2: PNG Direto
1. Crie `icon-192.png` e `icon-512.png`
2. Coloque em `public/`
3. Substitua os existentes

### Opção 3: Favicon Generator
1. Gere em https://realfavicongenerator.net
2. Baixe e substitua em `public/`

## Atualizações

### Forçar Atualização do SW
Usuários receberão atualização quando:
1. Nova versão deployada
2. Service Worker detecta mudança
3. Recarregamento automático (ou manual)

### Limpar Cache Manualmente
```javascript
// No Console do navegador
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

## Modo Garçom

Para garçons em campo:
1. Instale o PWA no celular
2. Faça login com credenciais de garçom
3. App funciona offline (cache de 24h)
4. Pedidos sincronizam quando conectar

## Troubleshooting

### PWA não aparece no mobile
- ✓ Verifique se está em HTTPS
- ✓ Manifest sem erros (DevTools → Application)
- ✓ Service Worker registrado
- ✓ Ícones 192x192 e 512x512 presentes

### Service Worker não atualiza
- Feche todas as abas do app
- Limpe cache do navegador
- Reabra em nova aba

### Cache desatualizado
- SW atualiza automaticamente em 24h
- Ou faça hard refresh: Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac)

## Status

- ✅ Manifest configurado
- ✅ Service Worker (Workbox)
- ✅ Ícones gerados (192, 512)
- ✅ Meta tags mobile
- ✅ Cache de API
- ✅ Tema dark
- ✅ Deploy Vercel
- ✅ HTTPS habilitado

## Próximos Passos

1. **Melhorias de UX Mobile**
   - Aumentar tamanho de botões
   - Otimizar layout para telas pequenas
   - Adicionar gestos touch

2. **Offline First**
   - IndexDB para pedidos offline
   - Queue de sincronização
   - Indicador de status de conexão

3. **Notificações Push**
   - Alertas de novos pedidos
   - Notificações para garçons
   - Background sync

4. **Analytics PWA**
   - Taxa de instalação
   - Uso offline
   - Tempo em tela
