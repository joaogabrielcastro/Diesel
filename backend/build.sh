#!/bin/bash
set -e

echo "🔧 Starting Diesel Bar build process..."
echo "⚠️  WARNING: This script forces Prisma 5.8.0 to prevent Prisma 7 issues"
echo ""

# Force Node 20
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"
echo ""

# Clean npm cache completely
echo "🧹 Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true
rm -rf ~/.npm/_cacache 2>/dev/null || true
echo "✅ Cache cleaned"
echo ""

# Install dependencies WITHOUT Prisma first
echo "📥 Installing dependencies (excluding Prisma)..."
npm install --legacy-peer-deps --no-audit
echo "✅ Dependencies installed"
echo ""

# FORCE REMOVE any Prisma 7 that was installed
echo "🗑️  Removing any existing Prisma installation..."
npm uninstall prisma @prisma/client 2>/dev/null || true
rm -rf node_modules/prisma 2>/dev/null || true
rm -rf node_modules/@prisma 2>/dev/null || true
rm -rf node_modules/.prisma 2>/dev/null || true
echo "✅ Prisma removed"
echo ""

# Install ONLY Prisma 5.8.0 with exact version
echo "📦 Installing Prisma 5.8.0 (EXACT VERSION)..."
npm install prisma@5.8.0 @prisma/client@5.8.0 --save-exact --legacy-peer-deps --force
echo "✅ Prisma 5.8.0 installed"
echo ""

# Verify Prisma version (CRITICAL CHECK)
echo "🔍 Verifying Prisma version..."
PRISMA_VERSION=$(npx prisma --version 2>&1 | grep "prisma" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -1)
echo "   Found Prisma version: $PRISMA_VERSION"

if [ "$PRISMA_VERSION" != "5.8.0" ]; then
    echo "❌ ERROR: Wrong Prisma version detected!"
    echo "   Expected: 5.8.0"
    echo "   Found: $PRISMA_VERSION"
    echo ""
    echo "Full Prisma version output:"
    npx prisma --version
    exit 1
fi

echo "✅ Prisma 5.8.0 verified successfully!"
echo ""

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Build NestJS application
echo "🏗️  Building NestJS application..."
npm run build
echo "✅ Application built successfully"
echo ""

echo "🎉 Build completed successfully!"
echo "   Prisma version: 5.8.0"
echo "   Ready for deployment"
