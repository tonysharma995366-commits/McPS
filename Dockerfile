# ─── Stage 1: Build frontend ───
FROM node:20-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build backend deps ───
FROM node:20-alpine AS backend-build
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# ─── Stage 3: Runtime ───
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV HOME=/root

# Install system deps (NO nodejs/npm from apt)
RUN apt-get update && apt-get install -y --no-install-recommends \
      openjdk-17-jre-headless \
      curl wget unzip ca-certificates gnupg \
      tini procps zip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify Node version
RUN node -v && npm -v

WORKDIR /app

# Copy backend
COPY --from=backend-build /build/backend/node_modules /app/backend/node_modules
COPY backend/ /app/backend/

# Copy frontend build
COPY --from=frontend-build /build/frontend/dist /app/frontend/dist

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Create runtime dirs
RUN mkdir -p /app/minecraft/plugins /app/minecraft/plugins-disabled \
             /app/minecraft/logs /app/minecraft/backups

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/start.sh"]
