#!/bin/bash
set -e

echo "🔧 Starting Diesel Bar build process..."

# Force Node 20
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Clean cache to avoid version conflicts
echo "🧹 Cleaning npm cache..."
npm cache clean --force || true

# Install dependencies with exact versions
echo "📥 Installing dependencies..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Force Prisma 5.8.0
echo "🔄 Forcing Prisma 5.8.0..."
npm install prisma@5.8.0 @prisma/client@5.8.0 --save-exact --legacy-peer-deps

# Verify Prisma version
echo "✅ Verifying Prisma version..."
npx prisma --version | grep "prisma"

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Build NestJS application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
