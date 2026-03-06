@echo off
chcp 65001 >nul
title Diesel Bar - Setup Inicial

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         🚀 DIESEL BAR - SETUP INICIAL                    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Este script irá configurar o projeto pela primeira vez.
echo.
pause

echo.
echo 📦 [1/4] Instalando dependências do Backend...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)

echo.
echo 📝 [2/4] Verificando arquivo .env do backend...
if not exist .env (
    echo ⚠️  Arquivo .env não encontrado!
    echo.
    echo Por favor, crie o arquivo backend\.env com:
    echo DATABASE_URL="postgresql://usuario:senha@localhost:5432/diesel_bar"
    echo JWT_SECRET="seu-secret-key-super-seguro"
    echo PORT=3000
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Arquivo .env encontrado
)

echo.
echo 🗄️  [3/4] Configurando banco de dados...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao gerar Prisma Client
    pause
    exit /b 1
)

call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao criar tabelas no banco
    pause
    exit /b 1
)

call npx ts-node prisma/seed.ts
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao popular banco
    pause
    exit /b 1
)

echo.
echo 📦 [4/4] Instalando dependências do Frontend...
cd ..\web
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)

echo.
echo 📝 Verificando arquivo .env do frontend...
if not exist .env (
    echo ⚠️  Arquivo .env não encontrado!
    echo.
    echo Por favor, crie o arquivo web\.env com:
    echo VITE_API_URL=http://localhost:3000
    echo VITE_WS_URL=ws://localhost:3000
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Arquivo .env encontrado
)

cd ..

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         ✅ SETUP CONCLUÍDO COM SUCESSO!                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📝 Próximos passos:
echo.
echo 1. Inicie o backend:  cd backend ^&^& npm run start:dev
echo 2. Inicie o frontend: cd web ^&^& npm run dev
echo 3. Acesse: http://localhost:5173
echo 4. Crie seu estabelecimento e primeiro usuário admin
echo.
echo 📚 Consulte SETUP.md para mais informações
echo.

pause
