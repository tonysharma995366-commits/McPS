import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";

let childProcess = null;

const state = {
  status: "stopped", // "starting" | "waiting_claim" | "connected" | "error" | "stopped"
  claimUrl: null,
  address: null,
  region: null,
  latency: null,
  startedAt: null,
  lastError: null,
  pid: null,
};

function getStateFilePath() {
  return path.join(CONFIG.mc.dir, "playit-state.json");
}

/**
 * Hydrates state from disk on startup if available.
 */
function hydrateInitialState() {
  try {
    const filePath = getStateFilePath();
    if (fs.existsSync(filePath)) {
      const saved = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (saved && typeof saved === "object") {
        state.claimUrl = saved.claimUrl || null;
        state.address = saved.address || null;
        state.region = saved.region || null;
        state.latency = saved.latency || null;
        log.debug("Hydrated persistent Playit state from disk");
      }
    }
  } catch {
    // ignore
  }
}

hydrateInitialState();

/**
 * Persists sanitized state to disk atomically.
 */
async function saveState() {
  try {
    const filePath = getStateFilePath();
    const dir = path.dirname(filePath);
    await fsp.mkdir(dir, { recursive: true });

    const payload = JSON.stringify({
      claimUrl: state.claimUrl,
      address: state.address,
      region: state.region,
      latency: state.latency,
      status: state.status,
      updatedAt: new Date().toISOString(),
    }, null, 2);

    const tempPath = `${filePath}.tmp.${Date.now()}`;
    await fsp.writeFile(tempPath, payload, "utf-8");
    await fsp.rename(tempPath, filePath);
  } catch {
    // Non-blocking
  }
}

function parseOutputLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  // 1. Claim URL detection
  const claimMatch = trimmed.match(/https:\/\/playit\.gg\/claim\/[A-Za-z0-9_-]+/i);
  if (claimMatch) {
    state.claimUrl = claimMatch[0];
    state.status = "waiting_claim";
    state.lastError = null;
    log.info(`[Playit]: Discovered claim URL: ${state.claimUrl}`);
    saveState();
  }

  // 2. Connection success / Active tunnel
  if (
    /connected|tunnel\s+active|tunnel\s+registered|agent\s+running/i.test(trimmed) &&
    !/not\s+connected|failed\s+to\s+connect/i.test(trimmed)
  ) {
    if (state.status !== "connected") {
      state.status = "connected";
      log.info("[Playit]: Playit tunnel active and connected");
      saveState();
    }
  }

  // 3. Address extraction (e.g. Tunnel address: xyz.playit.gg:25565 or <host>:<port>)
  const addrMatch = trimmed.match(/(?:tunnel\s+address|public\s+address|assigned\s+to|address):\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}:\d+)/i) ||
    trimmed.match(/([a-zA-Z0-9.-]+\.playit\.gg:\d+)/i);
  if (addrMatch) {
    state.address = addrMatch[1];
    state.status = "connected";
    log.info(`[Playit]: Public address assigned: ${state.address}`);
    saveState();
  }

  // 4. Region extraction
  const regionMatch = trimmed.match(/region:\s*([^\n\r,]+)/i);
  if (regionMatch) {
    state.region = regionMatch[1].trim();
    saveState();
  }

  // 5. Latency extraction
  const latencyMatch = trimmed.match(/(?:ping|latency|rtt):\s*(\d+)\s*ms/i);
  if (latencyMatch) {
    state.latency = parseInt(latencyMatch[1], 10);
    saveState();
  }

  // 6. Error detection
  if (/error:|fatal:|failed\s+to/i.test(trimmed) && !/no\s+error/i.test(trimmed)) {
    state.lastError = trimmed;
    if (state.status !== "connected") {
      state.status = "error";
    }
    log.warn(`[Playit]: ${trimmed}`);
    saveState();
  }
}

/**
 * Spawns the Playit.gg agent CLI.
 */
export async function start() {
  if (isRunning()) {
    log.debug("Playit agent is already running");
    return;
  }

  state.status = "starting";
  state.startedAt = Date.now();
  state.lastError = null;

  try {
    const customPath = process.env.PATH + ":/usr/local/bin:" + path.join(os.homedir(), ".local/bin");

    childProcess = spawn("playit", [], {
      env: { ...process.env, PATH: customPath },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    state.pid = childProcess.pid;
    log.info(`Playit agent process spawned with PID: ${childProcess.pid}`);

    childProcess.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      text.split("\n").forEach(parseOutputLine);
    });

    childProcess.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      text.split("\n").forEach(parseOutputLine);
    });

    childProcess.on("error", (err) => {
      log.warn(`Playit agent spawn error: ${err.message}`);
      state.status = "error";
      state.lastError = `Playit CLI unavailable (${err.message})`;
      state.pid = null;
      childProcess = null;
      saveState();
    });

    childProcess.on("close", (code) => {
      log.info(`Playit agent exited with code ${code}`);
      state.status = code === 0 ? "stopped" : "error";
      state.pid = null;
      childProcess = null;
      saveState();
    });

    saveState();
  } catch (err) {
    log.warn(`Could not start Playit agent: ${err.message}`);
    state.status = "error";
    state.lastError = err.message;
    saveState();
  }
}

/**
 * Stops the running Playit agent process.
 */
export async function stop() {
  if (!childProcess || !childProcess.pid) {
    state.status = "stopped";
    state.pid = null;
    return;
  }

  log.info(`Stopping Playit agent (PID: ${childProcess.pid})...`);
  const proc = childProcess;
  childProcess = null;
  state.pid = null;
  state.status = "stopped";

  try {
    proc.kill("SIGTERM");
    const killTimeout = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        // ignore
      }
    }, 5000);
    killTimeout.unref();
  } catch {
    // ignore
  }

  await saveState();
}

/**
 * Regenerates the Playit tunnel pairing by resetting config and restarting.
 */
export async function regenerate() {
  log.info("Regenerating Playit claim token...");
  await stop();
  await new Promise((r) => setTimeout(r, 1000));

  // Remove existing config files to force generation of a new claim code
  const configPaths = [
    path.join(os.homedir(), ".config/playit_gg/playit.toml"),
    path.join(os.homedir(), ".config/playit/playit.toml"),
    "/root/.config/playit_gg/playit.toml",
  ];

  for (const cfg of configPaths) {
    try {
      if (fs.existsSync(cfg)) {
        await fsp.unlink(cfg);
      }
    } catch {
      // ignore
    }
  }

  // Reset in-memory state
  state.claimUrl = null;
  state.address = null;
  state.region = null;
  state.status = "starting";
  await saveState();

  await start();

  // Wait briefly for claim URL discovery
  const startWait = Date.now();
  while (!state.claimUrl && Date.now() - startWait < 3000) {
    await new Promise((r) => setTimeout(r, 200));
  }

  return { claimUrl: state.claimUrl };
}

/**
 * Reconnects the Playit agent.
 */
export async function reconnect() {
  await stop();
  await new Promise((r) => setTimeout(r, 1000));
  await start();
  return { ok: true };
}

/**
 * Returns current Playit status with parsed host and port.
 */
export async function status() {
  let host = null;
  let port = null;

  if (state.address && state.address.includes(":")) {
    const parts = state.address.split(":");
    host = parts[0];
    port = parseInt(parts[1], 10) || null;
  }

  return {
    ...state,
    host,
    port,
  };
}

/**
 * Checks if the Playit agent child process is currently alive.
 */
export function isRunning() {
  if (!childProcess || !childProcess.pid) return false;
  try {
    process.kill(childProcess.pid, 0);
    return true;
  } catch {
    return false;
  }
}
