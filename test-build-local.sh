#!/bin/bash

echo "========================================="
echo "   TESTE LOCAL DO BUILD SCRIPT"
echo "========================================="
echo ""
echo "⚠️  ATENÇÃO: Este script vai:"
echo "   1. Limpar node_modules"
echo "   2. Simular o build do Render"
echo "   3. Verificar se Prisma 5.8.0 é instalado"
echo ""
read -p "Continuar? (s/N): " confirm

if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Cancelado pelo usuário."
    exit 0
fi

cd backend

echo ""
echo "🧹 Limpando ambiente..."
rm -rf node_modules
rm -rf package-lock.json
echo "✅ Ambiente limpo"

echo ""
echo "🚀 Executando build script..."
echo ""

if [ -f "build.sh" ]; then
    chmod +x build.sh
    ./build.sh
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================="
        echo "✅ BUILD SCRIPT FUNCIONOU!"
        echo "========================================="
        echo ""
        echo "Prisma instalado:"
        npx prisma --version | grep "prisma"
        echo ""
        echo "✅ Pronto para deploy no Render!"
    else
        echo ""
        echo "========================================="
        echo "❌ BUILD SCRIPT FALHOU!"
        echo "========================================="
        echo ""
        echo "Revise o arquivo build.sh"
        exit 1
    fi
else
    echo ""
    echo "❌ Arquivo build.sh não encontrado!"
    exit 1
fi

cd ..
