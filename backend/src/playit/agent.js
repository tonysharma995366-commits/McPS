import { exec, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "../config.js";
import logger from "../logger.js";

const PLAYIT_CONFIG_DIR = "/root/.config/playit";
const PLAYIT_LOG_FILE = path.join(CONFIG.mc.dir, "logs", "playit.log");
const STATE_FILE = path.join(CONFIG.mc.dir, "playit-state.json");

let state = {
  status: "stopped", // starting | waiting_claim | connected | error | stopped
  claimed: false,
  claimUrl: null,
  claimCode: null,
  address: null,
  host: null,
  port: null,
  region: null,
  latency: 25,
  startedAt: Date.now(),
  lastError: null,
};

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    // ignore
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      state = { ...state, ...saved };
    }
  } catch (err) {
    // ignore
  }
}

function checkPlayitLogs() {
  if (!fs.existsSync(PLAYIT_LOG_FILE)) return;
  try {
    const content = fs.readFileSync(PLAYIT_LOG_FILE, "utf-8");

    // Look for claim url: https://playit.gg/claim/[code]
    const claimMatch = content.match(/https:\/\/playit\.gg\/claim\/([a-zA-Z0-9_-]+)/i);
    if (claimMatch) {
      state.claimUrl = claimMatch[0];
      state.claimCode = claimMatch[1];
      if (state.status !== "connected") {
        state.status = "waiting_claim";
        state.claimed = false;
      }
    }

    // Look for assigned tunnel address
    const tunnelMatch = content.match(/([a-zA-Z0-9-]+\.(?:gl|at|ply|playit)\.gg):([0-9]+)/i);
    if (tunnelMatch) {
      state.address = `${tunnelMatch[1]}:${tunnelMatch[2]}`;
      state.host = tunnelMatch[1];
      state.port = parseInt(tunnelMatch[2], 10);
      state.status = "connected";
      state.claimed = true;
      state.lastError = null;
    } else if (content.includes("tunnel active") || content.includes("registered") || content.includes("connected")) {
      state.status = "connected";
      state.claimed = true;
      state.lastError = null;
    }

    // Ping / Latency check
    const latencyMatch = content.match(/(?:ping|latency|rtt|pingMs)[:\s]+([0-9]+)\s*ms/i);
    if (latencyMatch) {
      state.latency = parseInt(latencyMatch[1], 10);
    }

    // Region detection
    const regionMatch = content.match(/region[:\s]+([A-Za-z0-9\s()]+)/i);
    if (regionMatch) {
      state.region = regionMatch[1].trim();
    }

    saveState();
  } catch (err) {
    // ignore
  }
}

function ensurePlayitInstalled() {
  const binPath = "/usr/local/bin/playit";
  if (fs.existsSync(binPath)) {
    return binPath;
  }

  const localBinPath = path.join(CONFIG.mc.dir, "playit");
  if (fs.existsSync(localBinPath)) {
    return localBinPath;
  }

  logger.info("[playit] playit binary missing. Downloading...");
  try {
    const arch = process.arch; // 'x64' | 'arm64'
    let playitBinName = "playit-linux-amd64";
    if (arch === "arm64") {
      playitBinName = "playit-linux-aarch64";
    }

    const downloadUrl = `https://github.com/playit-cloud/playit-agent/releases/latest/download/${playitBinName}`;
    
    // Create directory
    fs.mkdirSync(CONFIG.mc.dir, { recursive: true });

    // Download playit locally using curl or wget
    logger.info(`[playit] Downloading playit agent from ${downloadUrl}...`);
    try {
      execSync(`curl -fsSL "${downloadUrl}" -o "${localBinPath}" && chmod +x "${localBinPath}"`);
    } catch {
      execSync(`wget -q "${downloadUrl}" -O "${localBinPath}" && chmod +x "${localBinPath}"`);
    }
    logger.info(`[playit] Successfully downloaded playit agent to ${localBinPath}`);
    return localBinPath;
  } catch (err) {
    logger.error(`[playit] Failed to download playit binary: ${err.message}`);
    return null;
  }
}

export async function start() {
  loadState();

  if (state.status === "stopped") {
    state.status = "starting";
    state.startedAt = Date.now();
  }

  // Ensure log directory exists
  fs.mkdirSync(path.dirname(PLAYIT_LOG_FILE), { recursive: true });

  // Periodically scan logs every 4 seconds
  if (!global.playitInterval) {
    global.playitInterval = setInterval(checkPlayitLogs, 4000);
  }

  // Ensure playit agent is running
  const resolvedBin = ensurePlayitInstalled() || "playit";
  isRunning((running) => {
    if (!running) {
      logger.info(`[playit] Spawning playit agent in background using ${resolvedBin}...`);
      exec(`"${resolvedBin}" --secret_path ${path.join(PLAYIT_CONFIG_DIR, "playit.toml")} > ${PLAYIT_LOG_FILE} 2>&1 &`);
    }
  });

  checkPlayitLogs();
}

export async function stop() {
  logger.info("[playit] Stopping playit agent...");
  state.status = "stopped";
  state.claimed = false;
  saveState();
  exec("pkill playit || true");
}

export async function regenerate() {
  logger.info("[playit] Regenerating claim URL...");
  await stop();

  const configPaths = [
    path.join(PLAYIT_CONFIG_DIR, "playit.toml"),
    path.join(PLAYIT_CONFIG_DIR, "playit.yml"),
    "/root/.config/playit/playit.toml",
  ];
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch {}
    }
  }

  // Reset local state
  state.claimUrl = null;
  state.claimCode = null;
  state.address = null;
  state.host = null;
  state.port = null;
  state.status = "starting";
  state.claimed = false;
  saveState();

  // Re-create empty log
  try {
    fs.writeFileSync(PLAYIT_LOG_FILE, "");
  } catch {}

  await new Promise((r) => setTimeout(r, 1000));
  await start();

  // Wait briefly for log scanning to pick it up
  for (let i = 0; i < 5; i++) {
    checkPlayitLogs();
    if (state.claimUrl) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  return { claimUrl: state.claimUrl };
}

export async function status() {
  checkPlayitLogs();
  return { ...state };
}

export async function reconnect() {
  await stop();
  await new Promise((r) => setTimeout(r, 1000));
  await start();
  return { ok: true };
}

export function isRunning(callback) {
  exec("pgrep playit", (err, stdout) => {
    const running = !!(stdout && stdout.trim());
    if (typeof callback === "function") {
      callback(running);
    }
  });
  return state.status !== "stopped";
}
