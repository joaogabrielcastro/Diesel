# Production build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install security updates for base image
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install --workspace=backend --include=dev

# Copy prisma schema 
COPY backend/prisma ./backend/prisma

# Generate Prisma Client
RUN npx prisma generate --schema=./backend/prisma/schema.prisma

# Copy source code
COPY backend ./backend

# Build application
RUN cd backend && npm run build

# Production image
FROM node:22-bookworm-slim

# Install security updates and create non-root user
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    useradd -m -u 1001 -s /bin/bash nodeuser

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install production dependencies only
RUN npm install --workspace=backend --omit=dev

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Change ownership to non-root user
RUN chown -R nodeuser:nodeuser /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "backend/dist/main.js"]
