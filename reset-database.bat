@echo off
chcp 65001 >nul
title Diesel Bar - Reset Database

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         🔄 DIESEL BAR - RESET DATABASE                    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo ⚠️  ATENÇÃO: Este script irá APAGAR TODOS OS DADOS do banco!
echo.
set /p confirm="Tem certeza que deseja continuar? (S/N): "

if /i not "%confirm%"=="S" (
    echo.
    echo ❌ Operação cancelada pelo usuário.
    echo.
    pause
    exit /b
)

echo.
echo 🔄 Iniciando reset do banco de dados...
echo.

cd backend

echo 📝 Etapa 1/4: Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ❌ Erro ao gerar Prisma Client
    pause
    exit /b 1
)

echo.
echo 🗑️  Etapa 2/4: Resetando banco de dados...
call npx prisma migrate reset --force --skip-seed
if errorlevel 1 (
    echo.
    echo ❌ Erro ao resetar banco
    pause
    exit /b 1
)

echo.
echo 📊 Etapa 3/4: Aplicando migrations...
call npx prisma db push
if errorlevel 1 (
    echo.
    echo ❌ Erro ao aplicar migrations
    pause
    exit /b 1
)

echo.
echo 🌱 Etapa 4/4: Executando seed...
call npx ts-node prisma/seed.ts
if errorlevel 1 (
    echo.
    echo ❌ Erro ao executar seed
    pause
    exit /b 1
)

cd ..

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         ✅ RESET CONCLUÍDO COM SUCESSO!                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📝 Próximos passos:
echo    1. Inicie o backend: cd backend ^&^& npm run start:dev
echo    2. Inicie o frontend: cd web ^&^& npm run dev
echo    3. Acesse http://localhost:5173
echo    4. Crie seu estabelecimento e primeiro usuário admin
echo.

pause
