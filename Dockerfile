# ============================================
# TestApp Production Dockerfile
# Multi-stage build for optimized production image
# ============================================

# -----------------------------------------
# Stage 1: Dependencies
# -----------------------------------------
FROM node:20-alpine AS dependencies

# Install security updates and required packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# -----------------------------------------
# Stage 2: Builder
# -----------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Run build if build script exists
RUN npm run build 2>/dev/null || echo "No build script"

# -----------------------------------------
# Stage 3: Production
# -----------------------------------------
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /usr/bin/dumb-init /usr/bin/dumb-init

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist 2>/dev/null || true
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copy essential config files
COPY --chown=nodejs:nodejs .env.production .env.production 2>/dev/null || true

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]
