# ─── Stage 1: Frontend build ───
FROM node:20-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Backend deps ───
FROM node:20-alpine AS backend-build
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm install --omit=dev

# ─── Stage 3: Main Ubuntu runtime ───
FROM --platform=linux/amd64 ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV HOME=/root
ENV NODE_ENV=production

# System packages: XFCE4 desktop + VNC + noVNC + Java + tools
RUN apt update -y && apt install --no-install-recommends -y \
    xfce4 xfce4-goodies tigervnc-standalone-server novnc websockify \
    sudo xterm init systemd snapd vim net-tools curl wget git tzdata \
    dbus-x11 x11-utils x11-xserver-utils x11-apps \
    software-properties-common \
    openjdk-17-jre-headless unzip zip procps tini ca-certificates gnupg \
  && rm -rf /var/lib/apt/lists/*

# Optional lightweight icon theme
RUN apt update -y && apt install -y --no-install-recommends \
    xubuntu-icon-theme \
  && rm -rf /var/lib/apt/lists/*

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt install -y nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && node -v && npm -v

# VNC setup
RUN touch /root/.Xauthority \
  && mkdir -p /root/.vnc \
  && printf '#!/bin/sh\nstartxfce4\n' > /root/.vnc/xstartup \
  && chmod +x /root/.vnc/xstartup

# App
WORKDIR /app

COPY --from=backend-build /build/backend/node_modules /app/backend/node_modules
COPY backend/ /app/backend/
COPY --from=frontend-build /build/frontend/dist /app/frontend/dist
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

RUN mkdir -p /app/minecraft/plugins /app/minecraft/plugins-disabled \
             /app/minecraft/logs /app/minecraft/backups

EXPOSE 5901
EXPOSE 6080
EXPOSE 8080

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/start.sh"]
