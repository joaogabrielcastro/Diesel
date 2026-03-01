@echo off
echo ========================================
echo  Diesel Bar - Quick Start Script
echo ========================================
echo.

echo [1/4] Instalando dependencias do Backend...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao instalar dependencias do backend
    pause
    exit /b 1
)

echo.
echo [2/4] Configurando banco de dados...
copy .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

echo.
echo [3/4] Instalando dependencias do Web...
cd ..\web
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao instalar dependencias do web
    pause
    exit /b 1
)

echo.
echo [4/4] Instalando dependencias do Mobile...
cd ..\mobile
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao instalar dependencias do mobile
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo  Instalacao concluida com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo.
echo 1. Inicie o PostgreSQL (ou use docker-compose up)
echo 2. Backend:  cd backend  ^&^& npm run start:dev
echo 3. Web:      cd web      ^&^& npm run dev
echo 4. Mobile:   cd mobile   ^&^& npx expo start
echo.
echo Credenciais demo:
echo   Admin:  admin@demo.com / 123456
echo   Garcom: garcom@demo.com / 123456
echo.
pause
