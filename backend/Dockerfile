# Multi-stage build for AI Asset Accelerator Backend
# Stage 1: Build dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production image
FROM node:18-alpine AS production

# Install system dependencies for Sharp and other native modules
RUN apk add --no-cache \
    vips-dev \
    tiff \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy package files
COPY package*.json ./

# Copy built dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Remove unnecessary files for production
RUN rm -rf \
    __tests__ \
    *.md \
    .git* \
    .env.example \
    docker-compose.yml

# Change ownership of app directory to nodeuser
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (res) => { \
        if (res.statusCode === 200) process.exit(0); \
        else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Start the application
CMD ["node", "index.js"]

# Labels for metadata
LABEL maintainer="AI Asset Accelerator Team"
LABEL version="1.0.0"
LABEL description="Backend API for AI Asset Accelerator mobile app"
LABEL org.opencontainers.image.source="https://github.com/your-org/ai-asset-accelerator" 