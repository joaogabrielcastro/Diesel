# Script de verificacao para deploy no Render
Write-Host ""
Write-Host "Verificando configuracoes para deploy no Render..." -ForegroundColor Cyan
Write-Host ""

$checksPassed = 0
$checksFailed = 0

# Check 1: render.yaml exists
Write-Host "1. render.yaml existe? " -NoNewline
if (Test-Path "render.yaml") {
    Write-Host "OK" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "FALTA" -ForegroundColor Red
    $checksFailed++
}

# Check 2: build.sh exists
Write-Host "2. backend/build.sh existe? " -NoNewline
if (Test-Path "backend/build.sh") {
    Write-Host "OK" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "FALTA" -ForegroundColor Red
    $checksFailed++
}

# Check 3: .npmrc exists
Write-Host "3. backend/.npmrc existe? " -NoNewline
if (Test-Path "backend/.npmrc") {
    Write-Host "OK" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "FALTA" -ForegroundColor Red
    $checksFailed++
}

# Check 4: Prisma version in package.json
Write-Host "4. Prisma 5.8.0 em package.json? " -NoNewline
$packageJson = Get-Content "backend/package.json" -Raw
if ($packageJson -match '"@prisma/client": "5.8.0"' -and $packageJson -match '"prisma": "5.8.0"') {
    Write-Host "OK" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "ERRO" -ForegroundColor Red
    $checksFailed++
}

# Check 5: Prisma local version
Write-Host "5. Prisma 5.8.0 instalado localmente? " -NoNewline
Push-Location backend -ErrorAction SilentlyContinue
$prismaOutput = npx prisma --version 2>&1 | Out-String
if ($prismaOutput -match "prisma\s+:\s+5\.8\.0") {
    Write-Host "OK" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "OUTRO" -ForegroundColor Yellow
}
Pop-Location

# Check 6: .env exists
Write-Host "6. backend/.env existe? " -NoNewline
if (Test-Path "backend/.env") {
    Write-Host "OK" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "AVISO" -ForegroundColor Yellow
}

# Check 7: Git repo
Write-Host "7. Git repository? " -NoNewline
if (Test-Path ".git") {
    Write-Host "OK" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "NAO" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Gray
Write-Host "Resultado: $checksPassed OK | $checksFailed FALHAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

if ($checksFailed -eq 0) {
    Write-Host "SUCESSO! Tudo pronto para deploy no Render!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:"
    Write-Host "1. git add ."
    Write-Host "2. git commit -m 'fix: Prisma 5.8.0 config'"
    Write-Host "3. git push origin main"
    Write-Host "4. Criar Web Service no Render"
    Write-Host "5. Deploy automatico!"
} else {
    Write-Host "ATENCAO! Corrigir problemas acima." -ForegroundColor Red
    Write-Host ""
    Write-Host "Ver documentacao:"
    Write-Host "- QUICK_DEPLOY.md"
    Write-Host "- PRISMA_FIX_SUMMARY.md"
}

Write-Host ""
