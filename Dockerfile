# Multi-stage Dockerfile for Personal Finance Dashboard

# Development stage
FROM node:18 AS development

WORKDIR /app

# Install build dependencies for native modules (bcrypt) and bash for devcontainer features
RUN apt update && apt install -y python3 make g++ bash git vim

# Set proper ownership for the node user
RUN chown -R node:node /app

# Switch to node user early to avoid permission issues
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Install Claude Code globally for development
USER root
RUN npm install -g @anthropic-ai/claude-code
USER node

# Copy source code
COPY --chown=node:node . .

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads

# Expose development port
EXPOSE 3000

# Start development server with nodemon
CMD ["npm", "run", "dev"]

# Production base stage
FROM node:18 AS production-base

WORKDIR /app

# Install build dependencies for native modules (bcrypt) and bash for devcontainer features
RUN apt install -y python3 make g++ bash git

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy production node_modules from production-base
COPY --from=production-base /app/node_modules ./node_modules

# Copy application files
COPY package*.json ./
COPY server.js ./
COPY server/ ./server/
COPY public/ ./public/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R node:node /app

# Switch to non-root user
USER node

# Expose production port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start production server
CMD ["npm", "start"]
