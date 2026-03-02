@echo off
echo ========================================
echo  Diesel Bar - Teste de API
echo ========================================
echo.

echo [1/3] Testando conexao com API...
curl -s http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"email\":\"admin@demo.com\",\"password\":\"123456\"}" > response.json
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend respondendo
) else (
    echo ❌ Backend nao esta respondendo
    pause
    exit /b 1
)

echo.
echo [2/3] Verificando autenticacao...
findstr "access_token" response.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Autenticacao funcionando
) else (
    echo ❌ Erro na autenticacao
    type response.json
    pause
    exit /b 1
)

echo.
echo [3/3] Limpando...
del response.json

echo.
echo ========================================
echo  ✅ Todos os testes passaram!
echo ========================================
echo.
echo Backend rodando em: http://localhost:3000/api
echo.
echo Proximos passos:
echo 1. Teste o web: cd web ^&^& npm run dev
echo 2. Teste o mobile: cd mobile ^&^& npx expo start
echo 3. Deploy: Siga docs/PRODUCTION_DEPLOY.md
echo.
pause
