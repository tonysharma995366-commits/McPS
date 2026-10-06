#!/usr/bin/env bash
set -e

echo "════════════════════════════════════════════"
echo "  MC RailAdmin — All-in-One Boot"
echo "════════════════════════════════════════════"

MC_DIR="${MC_DIR:-/app/minecraft}"
LOG_DIR="$MC_DIR/logs"
PORT="${PORT:-8080}"
VNC_PORT=5901
NOVNC_PORT=6080

mkdir -p "$MC_DIR/plugins" "$MC_DIR/plugins-disabled" \
         "$LOG_DIR" "$MC_DIR/backups"

# ─────────────────────────────────────
# 1. START VNC DESKTOP (background)
# ─────────────────────────────────────
echo "[vnc] Starting XFCE desktop..."
vncserver :1 -localhost no -SecurityTypes None \
  -geometry 1024x768 --I-KNOW-THIS-IS-INSECURE \
  > "$LOG_DIR/vnc.log" 2>&1 \
  && echo "[vnc] Desktop running on :$VNC_PORT" \
  || echo "[vnc] WARN: vncserver failed"

# ─────────────────────────────────────
# 2. START noVNC (background)
# ─────────────────────────────────────
echo "[vnc] Starting noVNC websockify..."
cd /root
openssl req -new -subj "/C=JP" -x509 -days 365 -nodes \
  -out /root/self.pem -keyout /root/self.pem 2>/dev/null

websockify -D --web=/usr/share/novnc/ --cert=/root/self.pem \
  "$NOVNC_PORT" "localhost:$VNC_PORT" \
  > "$LOG_DIR/novnc.log" 2>&1 \
  && echo "[vnc] noVNC listening on :$NOVNC_PORT" \
  || echo "[vnc] WARN: websockify failed"

# ─────────────────────────────────────
# 3. DOWNLOAD PAPER (if missing)
# ─────────────────────────────────────
if [ ! -f "$MC_DIR/server.jar" ]; then
  MC_VERSION="${MC_VERSION:-1.20.4}"
  echo "[mc] Fetching latest Paper $MC_VERSION build..."

  LATEST=$(curl -fsSL \
    "https://fill.papermc.io/v3/projects/paper/versions/$MC_VERSION/builds/latest" \
    | grep -oE '"id":[0-9]+' | head -1 | grep -oE '[0-9]+' \
    || echo "")

  JAR_URL=""
  if [ -n "$LATEST" ]; then
    JAR_URL=$(curl -fsSL \
      "https://fill.papermc.io/v3/projects/paper/versions/$MC_VERSION/builds/$LATEST" \
      | grep -oE '"url":"[^"]+\.jar"' | head -1 \
      | sed 's/"url":"//;s/"$//')
  fi

  if [ -z "$JAR_URL" ] || [ -z "$LATEST" ]; then
    echo "[mc] Fallback to legacy Paper API..."
    LATEST="499"
    JAR_URL="https://api.papermc.io/v2/projects/paper/versions/$MC_VERSION/builds/$LATEST/downloads/paper-$MC_VERSION-$LATEST.jar"
  fi

  echo "[mc] Downloading: $JAR_URL"
  curl -fsSL "$JAR_URL" -o "$MC_DIR/server.jar" \
    && echo "[mc] Downloaded Paper build $LATEST" \
    || echo "[mc] ERROR: Download failed"
fi

# ─────────────────────────────────────
# 4. server.properties + EULA
# ─────────────────────────────────────
if [ ! -f "$MC_DIR/server.properties" ]; then
  cat > "$MC_DIR/server.properties" <<EOF
server-port=${MC_SERVER_PORT:-25565}
motd=Railway MC Server
online-mode=false
enable-rcon=true
rcon.port=${RCON_PORT:-25575}
rcon.password=${RCON_PASSWORD:-changeme}
max-players=20
view-distance=6
simulation-distance=6
white-list=false
EOF
  echo "[mc] Wrote default server.properties"
fi

echo "eula=true" > "$MC_DIR/eula.txt"

# ─────────────────────────────────────
# 5. INSTALL PLAYIT (if missing)
# ─────────────────────────────────────
if ! command -v playit >/dev/null 2>&1; then
  echo "[playit] Installing playit.gg agent..."
  PLAYIT_ARCH="$(uname -m)"
  case "$PLAYIT_ARCH" in
    x86_64) PLAYIT_BIN="playit-linux-amd64" ;;
    aarch64) PLAYIT_BIN="playit-linux-aarch64" ;;
    *) PLAYIT_BIN="playit-linux-amd64" ;;
  esac

  curl -fsSL \
    "https://github.com/playit-cloud/playit-agent/releases/latest/download/${PLAYIT_BIN}" \
    -o /usr/local/bin/playit \
    && chmod +x /usr/local/bin/playit \
    && echo "[playit] Installed to /usr/local/bin/playit" \
    || echo "[playit] WARN: install failed"
fi

  # Ensure playit config dir exists
  mkdir -p "$HOME/.config/playit_gg"

  # If PLAYIT_SECRET is set, write it to playit.toml
  if [ -n "$PLAYIT_SECRET" ]; then
    cat > "$HOME/.config/playit_gg/playit.toml" <<EOF
secret_key = "$PLAYIT_SECRET"
EOF
    echo "[playit] Secret configured in playit.toml"
  fi

# ─────────────────────────────────────
# 6. START MINECRAFT (background)
# ─────────────────────────────────────
if [ -f "$MC_DIR/server.jar" ]; then
  echo "[mc] Starting Minecraft server..."
  cd "$MC_DIR"
  nohup java -Xms"${MC_RAM_MIN:-512M}" -Xmx"${MC_RAM_MAX:-1536M}" \
    -jar server.jar nogui > "$LOG_DIR/console.log" 2>&1 &
  echo $! > "$MC_DIR/mc.pid"
  echo "[mc] Minecraft PID: $(cat $MC_DIR/mc.pid)"
else
  echo "[mc] WARN: server.jar missing — skipping MC start"
fi

# ─────────────────────────────────────
# 7. START BACKEND (foreground)
# ─────────────────────────────────────
echo "[backend] Starting Node.js on :$PORT"
cd /app/backend
exec node src/index.js
