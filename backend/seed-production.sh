#!/bin/bash
# Script para executar seed no Render

echo "🌱 Running database seed..."

# Generate Prisma Client
npx prisma generate

# Run seed
npx prisma db seed

echo "✅ Seed completed!"
