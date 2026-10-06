import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "../config.js";
import logger from "../logger.js";

const STATE_FILE = path.join(CONFIG.mc.dir, "playit-state.json");
const LOG_FILE = path.join(CONFIG.mc.dir, "logs", "playit.log");

let state = {
  status: "stopped",       // stopped | starting | waiting_claim | connected | error
  claimUrl: null,
  address: null,
  host: null,
  port: null,
  region: null,
  latency: null,
  startedAt: null,
  lastError: null,
  pid: null,
};

let child = null;

function saveState() {
  try {
    const toSave = { ...state };
    delete toSave.pid;
    fs.writeFileSync(STATE_FILE, JSON.stringify(toSave, null, 2));
  } catch (err) {
    logger.warn(`[playit] Could not save state: ${err.message}`);
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      state = { ...state, ...saved, pid: null };
      logger.info(`[playit] Loaded previous state: ${state.status}`);
    }
  } catch (err) {
    logger.warn(`[playit] Could not load state: ${err.message}`);
  }
}

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  // Log every line for debugging
  logger.debug(`[playit] ${trimmed}`);

  // Claim URL pattern
  const claimMatch = trimmed.match(/https:\/\/playit\.gg\/claim\/[A-Za-z0-9]+/);
  if (claimMatch) {
    state.claimUrl = claimMatch[0];
    state.status = "waiting_claim";
    state.lastError = null;
    logger.info(`[playit] Claim URL detected: ${state.claimUrl}`);
    saveState();
    return;
  }

  // Tunnel address (host:port)
  const addrMatch = trimmed.match(/([a-z0-9-]+\.playit\.gg):(\d+)/i);
  if (addrMatch) {
    state.address = `${addrMatch[1]}:${addrMatch[2]}`;
    state.host = addrMatch[1];
    state.port = parseInt(addrMatch[2], 10);
    state.status = "connected";
    state.lastError = null;
    logger.info(`[playit] Tunnel active: ${state.address}`);
    saveState();
    return;
  }

  // Region detection
  const regionMatch = trimmed.match(/region[:\s]+([A-Za-z\s()]+)/i);
  if (regionMatch) {
    state.region = regionMatch[1].trim();
    saveState();
  }

  // Error detection
  if (/error|failed|cannot|unable/i.test(trimmed)) {
    if (!state.claimUrl && state.status !== "connected") {
      state.lastError = trimmed;
      logger.warn(`[playit] Error line: ${trimmed}`);
      saveState();
    }
  }
}

export async function start() {
  if (child && !child.killed) {
    logger.info("[playit] Agent already running");
    return;
  }

  loadState();

  // Verify binary exists
  const binPath = "/usr/local/bin/playit";
  if (!fs.existsSync(binPath)) {
    state.status = "error";
    state.lastError = "playit binary not found at " + binPath;
    logger.error(`[playit] ${state.lastError}`);
    saveState();
    return;
  }

  // Ensure log dir exists
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

  logger.info("[playit] Starting agent...");
  state.status = "starting";
  state.startedAt = Date.now();
  state.lastError = null;
  saveState();

  // Spawn playit
  const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

  try {
    child = spawn(binPath, [], {
      cwd: CONFIG.mc.dir,
      env: {
        ...process.env,
        HOME: process.env.HOME || "/root",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    state.status = "error";
    state.lastError = err.message;
    logger.error(`[playit] Spawn failed: ${err.message}`);
    saveState();
    return;
  }

  state.pid = child.pid;
  logger.info(`[playit] Spawned PID ${child.pid}`);

  // Capture stdout + stderr line by line
  let stdoutBuf = "";
  let stderrBuf = "";

  child.stdout.on("data", (data) => {
    const text = data.toString();
    logStream.write(text);
    stdoutBuf += text;
    const lines = stdoutBuf.split("\n");
    stdoutBuf = lines.pop() || "";
    for (const line of lines) parseLine(line);
  });

  child.stderr.on("data", (data) => {
    const text = data.toString();
    logStream.write("[stderr] " + text);
    stderrBuf += text;
    const lines = stderrBuf.split("\n");
    stderrBuf = lines.pop() || "";
    for (const line of lines) parseLine(line);
  });

  child.on("exit", (code, signal) => {
    logger.warn(`[playit] Agent exited (code=${code}, signal=${signal})`);
    logStream.end();
    state.pid = null;
    if (state.status !== "connected") {
      state.status = "stopped";
    }
    child = null;
    saveState();
  });

  child.on("error", (err) => {
    logger.error(`[playit] Child process error: ${err.message}`);
    state.lastError = err.message;
    state.status = "error";
    saveState();
  });

  // Timeout — if no claim URL or connection in 30s, mark as error
  setTimeout(() => {
    if (state.status === "starting") {
      state.status = "error";
      state.lastError = "Timeout: no claim URL or connection after 30s";
      logger.warn("[playit] Startup timeout");
      saveState();
    }
  }, 30000);
}

export async function stop() {
  if (!child || child.killed) {
    state.status = "stopped";
    state.pid = null;
    saveState();
    return;
  }
  logger.info("[playit] Stopping agent...");
  child.kill("SIGTERM");
  setTimeout(() => {
    if (child && !child.killed) child.kill("SIGKILL");
  }, 5000);
  state.status = "stopped";
  state.pid = null;
  saveState();
}

export async function regenerate() {
  logger.info("[playit] Regenerating claim URL...");
  await stop();
  // Delete existing config so playit will emit a new claim URL
  const configPaths = [
    path.join(process.env.HOME || "/root", ".config/playit_gg/playit.toml"),
    path.join(process.env.HOME || "/root", ".config/playit_gg/playit.yml"),
  ];
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch {}
    }
  }
  // Clear state
  state.claimUrl = null;
  state.address = null;
  state.status = "starting";
  saveState();
  await new Promise((r) => setTimeout(r, 1000));
  await start();
  return { claimUrl: state.claimUrl };
}

export async function status() {
  return { ...state };
}

export async function reconnect() {
  await stop();
  await new Promise((r) => setTimeout(r, 1000));
  await start();
  return { ok: true };
}

export function isRunning() {
  return child !== null && !child.killed;
}
