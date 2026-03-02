#!/bin/bash

echo "🔍 Verificando configurações para deploy no Render..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

checks_passed=0
checks_failed=0

# Check 1: render.yaml exists
echo -n "1. render.yaml existe? "
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}✗${NC} (criar render.yaml)"
    checks_failed=$((checks_failed + 1))
fi

# Check 2: build.sh exists
echo -n "2. backend/build.sh existe? "
if [ -f "backend/build.sh" ]; then
    echo -e "${GREEN}✓${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}✗${NC} (criar backend/build.sh)"
    checks_failed=$((checks_failed + 1))
fi

# Check 3: .npmrc exists
echo -n "3. backend/.npmrc existe? "
if [ -f "backend/.npmrc" ]; then
    echo -e "${GREEN}✓${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}✗${NC} (criar backend/.npmrc)"
    checks_failed=$((checks_failed + 1))
fi

# Check 4: Prisma version in package.json
echo -n "4. Prisma 5.8.0 em package.json? "
if grep -q '"@prisma/client": "5.8.0"' backend/package.json && grep -q '"prisma": "5.8.0"' backend/package.json; then
    echo -e "${GREEN}✓${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}✗${NC} (atualizar package.json)"
    checks_failed=$((checks_failed + 1))
fi

# Check 5: Prisma local version
echo -n "5. Prisma 5.8.0 instalado localmente? "
cd backend
prisma_version=$(npx prisma --version 2>/dev/null | grep "prisma" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
if [ "$prisma_version" = "5.8.0" ]; then
    echo -e "${GREEN}✓${NC} (versão $prisma_version)"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}✗${NC} (versão encontrada: $prisma_version)"
    checks_failed=$((checks_failed + 1))
fi
cd ..

# Check 6: Schema prisma válido
echo -n "6. Schema Prisma válido? "
cd backend
if npx prisma validate 2>/dev/null | grep -q "validated successfully"; then
    echo -e "${GREEN}✓${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}✗${NC}"
    checks_failed=$((checks_failed + 1))
fi
cd ..

# Check 7: .env com DATABASE_URL
echo -n "7. DATABASE_URL configurada? "
if [ -f "backend/.env" ] && grep -q "DATABASE_URL=" backend/.env; then
    echo -e "${GREEN}✓${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${YELLOW}⚠${NC} (necessário no Render)"
    checks_failed=$((checks_failed + 1))
fi

# Check 8: .env com JWT_SECRET
echo -n "8. JWT_SECRET configurada? "
if [ -f "backend/.env" ] && grep -q "JWT_SECRET=" backend/.env; then
    echo -e "${GREEN}✓${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${YELLOW}⚠${NC} (necessário no Render)"
    checks_failed=$((checks_failed + 1))
fi

# Check 9: Git status
echo -n "9. Alterações commitadas? "
if [ -d ".git" ]; then
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${GREEN}✓${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${YELLOW}⚠${NC} (há alterações não commitadas)"
        echo -e "${YELLOW}   Execute: git add . && git commit -m 'fix: Prisma 5.8.0'${NC}"
    fi
else
    echo -e "${YELLOW}⚠${NC} (não é um repositório Git)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Resultado: ${GREEN}$checks_passed passaram${NC} | ${RED}$checks_failed falharam${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo pronto para deploy no Render!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. git push origin main"
    echo "2. Criar Web Service no Render"
    echo "3. Configurar DATABASE_URL e JWT_SECRET"
    echo "4. Deploy!"
else
    echo -e "${RED}❌ Corrigir os problemas acima antes do deploy${NC}"
    echo ""
    echo "Ver documentação:"
    echo "- QUICK_DEPLOY.md (guia rápido)"
    echo "- RENDER_DEPLOY_GUIDE.md (guia completo)"
fi

echo ""
