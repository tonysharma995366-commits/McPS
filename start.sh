#!/usr/bin/env bash
set -e

echo "═══════════════════════════════════════════"
echo "  MC RailAdmin — Starting"
echo "═══════════════════════════════════════════"

MC_DIR="${MC_DIR:-/app/minecraft}"
LOG_DIR="$MC_DIR/logs"
PORT="${PORT:-3000}"

mkdir -p "$MC_DIR/plugins" "$MC_DIR/plugins-disabled" \
         "$LOG_DIR" "$MC_DIR/backups"

# 1. Download Paper if missing
if [ ! -f "$MC_DIR/server.jar" ]; then
  MC_VERSION="${MC_VERSION:-1.20.4}"
  echo "[setup] Fetching latest Paper $MC_VERSION build..."

  # Try new PaperMC API (fill.papermc.io/v3)
  LATEST=$(curl -fsSL \
    "https://fill.papermc.io/v3/projects/paper/versions/$MC_VERSION/builds/latest" \
    | grep -oE '"id":[0-9]+' | head -1 | grep -oE '[0-9]+' || true)

  if [ -n "$LATEST" ]; then
    JAR_URL=$(curl -fsSL \
      "https://fill.papermc.io/v3/projects/paper/versions/$MC_VERSION/builds/$LATEST" \
      | grep -oE '"url":"[^"]+\.jar"' | head -1 | sed 's/"url":"//;s/"$//' || true)
  fi

  # Fallback to direct download URL pattern if v3 lookup fails
  if [ -z "$JAR_URL" ]; then
    echo "[setup] Using Paper v2 API fallback for $MC_VERSION..."
    BUILD_JSON=$(curl -fsSL "https://api.papermc.io/v2/projects/paper/versions/$MC_VERSION" || true)
    LATEST=$(echo "$BUILD_JSON" | grep -oE '"builds":\[[0-9,]+' | grep -oE '[0-9]+$' || true)
    if [ -n "$LATEST" ]; then
      JAR_URL="https://api.papermc.io/v2/projects/paper/versions/$MC_VERSION/builds/$LATEST/downloads/paper-$MC_VERSION-$LATEST.jar"
    fi
  fi

  if [ -z "$JAR_URL" ]; then
    echo "[setup] ERROR: Could not determine Paper jar download URL" >&2
    exit 1
  fi

  curl -fsSL "$JAR_URL" -o "$MC_DIR/server.jar"
  echo "[setup] Downloaded Paper build $LATEST"
fi

# 2. server.properties
if [ ! -f "$MC_DIR/server.properties" ]; then
  echo "[setup] Writing default server.properties"
  cat > "$MC_DIR/server.properties" <<EOF
server-port=${MC_SERVER_PORT:-25565}
motd=Railway MC Server
online-mode=true
enable-rcon=true
rcon.port=${RCON_PORT:-25575}
rcon.password=${RCON_PASSWORD:-changeme}
max-players=20
view-distance=6
simulation-distance=6
white-list=false
EOF
fi

# 3. EULA
echo "eula=true" > "$MC_DIR/eula.txt"

# 4. Playit agent
if ! command -v playit >/dev/null 2>&1; then
  echo "[setup] Installing playit.gg agent..."
  curl -fsSL https://playit.gg/install.sh | bash || true
  export PATH="$HOME/.local/bin:$PATH"
fi

if [ -n "$PLAYIT_SECRET" ]; then
  mkdir -p "$HOME/.config/playit_gg"
  cat > "$HOME/.config/playit_gg/playit.toml" <<EOF
secret_key = "$PLAYIT_SECRET"
EOF
  echo "[setup] playit secret configured"
fi

# 5. Minecraft server (background)
echo "[setup] Starting Minecraft server..."
cd "$MC_DIR"
nohup java -Xms"${MC_RAM_MIN:-512M}" -Xmx"${MC_RAM_MAX:-1536M}" \
      -jar server.jar nogui > "$LOG_DIR/console.log" 2>&1 &
echo $! > "$MC_DIR/mc.pid"
echo "[setup] Minecraft PID: $(cat $MC_DIR/mc.pid)"

# 6. Backend (foreground)
echo "[setup] Starting backend on :$PORT"
cd /app/backend
exec node src/index.js
