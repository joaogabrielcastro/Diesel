# Script para regenerar o Prisma Client
# Execute este script se tiver erros de tipo do Prisma

Write-Host "=== Regenerando Prisma Client ===" -ForegroundColor Cyan

# Parar processos Node que podem estar bloqueando
Write-Host "`nParando processos Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Aguardar um pouco
Start-Sleep -Seconds 3

# Navegar para o diretório backend
Set-Location $PSScriptRoot

# Remover pasta do Prisma Client (se conseguir)
Write-Host "`nRemovendo Prisma Client antigo..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "..\node_modules\.prisma\client" -ErrorAction SilentlyContinue

# Regenerar Prisma Client
Write-Host "`nRegenerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n=== Concluído! ===" -ForegroundColor Green
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
