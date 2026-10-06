import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import * as rcon from "../rcon.js";

/**
 * Reads the PID file and determines if the Minecraft Java process is currently alive.
 *
 * @returns {Promise<boolean>}
 */
export async function isRunning() {
  try {
    if (!fs.existsSync(CONFIG.mc.pidFile)) {
      return false;
    }

    const pidContent = await fsp.readFile(CONFIG.mc.pidFile, "utf-8");
    const pid = parseInt(pidContent.trim(), 10);

    if (isNaN(pid) || pid <= 0) {
      return false;
    }

    // Signal 0 tests for process existence without killing it
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the server process ID if running.
 *
 * @returns {Promise<number | null>}
 */
export async function getPid() {
  try {
    if (!fs.existsSync(CONFIG.mc.pidFile)) return null;
    const pidStr = await fsp.readFile(CONFIG.mc.pidFile, "utf-8");
    const pid = parseInt(pidStr.trim(), 10);
    if (!isNaN(pid) && pid > 0) {
      process.kill(pid, 0);
      return pid;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Computes the server process uptime in seconds.
 *
 * @returns {Promise<number>}
 */
export async function getUptime() {
  const pid = await getPid();
  if (!pid) return 0;

  try {
    // On Linux containers, check /proc/<pid>/stat start time or file stat mtime
    const procStatPath = `/proc/${pid}/stat`;
    if (fs.existsSync(procStatPath)) {
      const stats = await fsp.stat(procStatPath);
      return Math.max(0, Math.floor((Date.now() - stats.ctimeMs) / 1000));
    }

    // Fallback: PID file modification time
    const pidStats = await fsp.stat(CONFIG.mc.pidFile);
    return Math.max(0, Math.floor((Date.now() - pidStats.mtimeMs) / 1000));
  } catch {
    return 0;
  }
}

/**
 * Spawns the Minecraft Paper server process in background.
 *
 * @returns {Promise<{ pid: number }>}
 */
export async function startServer() {
  const running = await isRunning();
  if (running) {
    throw new Error("Server already running");
  }

  // Ensure directories exist
  await fsp.mkdir(CONFIG.mc.dir, { recursive: true });
  await fsp.mkdir(path.dirname(CONFIG.mc.logFile), { recursive: true });

  const logStream = fs.openSync(CONFIG.mc.logFile, "a");

  const args = [
    `-Xms${CONFIG.mc.ramMin}`,
    `-Xmx${CONFIG.mc.ramMax}`,
    "-jar",
    "server.jar",
    "nogui",
  ];

  log.info(`Starting Minecraft server: java ${args.join(" ")} (cwd: ${CONFIG.mc.dir})`);

  const child = spawn("java", args, {
    cwd: CONFIG.mc.dir,
    detached: true,
    shell: false,
    stdio: ["ignore", logStream, logStream],
  });

  child.unref();

  if (!child.pid) {
    fs.closeSync(logStream);
    throw new Error("Failed to spawn Minecraft Java process");
  }

  await fsp.writeFile(CONFIG.mc.pidFile, String(child.pid), "utf-8");
  log.info(`Minecraft server process spawned with PID: ${child.pid}`);

  return { pid: child.pid };
}

/**
 * Stops the Minecraft server gracefully via RCON or forcefully with SIGKILL.
 *
 * @param {boolean} [graceful=true]
 * @returns {Promise<{ stopped: boolean }>}
 */
export async function stopServer(graceful = true) {
  const pid = await getPid();

  if (!pid) {
    if (fs.existsSync(CONFIG.mc.pidFile)) {
      await fsp.unlink(CONFIG.mc.pidFile).catch(() => {});
    }
    return { stopped: true };
  }

  if (graceful) {
    try {
      log.info("Sending RCON 'stop' command to Minecraft server...");
      await rcon.send("stop");
    } catch (err) {
      log.warn(`Could not send graceful stop via RCON (${err.message}). Sending SIGTERM to PID ${pid}...`);
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // ignore
      }
    }

    // Wait up to 30s for process termination
    const startWait = Date.now();
    while (Date.now() - startWait < 30000) {
      try {
        process.kill(pid, 0);
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        // Process is dead
        break;
      }
    }
  }

  // Check if still alive, force kill
  try {
    process.kill(pid, 0);
    log.warn(`Process ${pid} still running. Sending SIGKILL...`);
    process.kill(pid, "SIGKILL");
  } catch {
    // Process already terminated
  }

  if (fs.existsSync(CONFIG.mc.pidFile)) {
    await fsp.unlink(CONFIG.mc.pidFile).catch(() => {});
  }

  log.info(`Minecraft server (PID ${pid}) stopped.`);
  return { stopped: true };
}

/**
 * Restarts the Minecraft server by stopping cleanly then starting after 3s.
 *
 * @returns {Promise<{ restarted: boolean }>}
 */
export async function restartServer() {
  log.info("Initiating Minecraft server restart...");
  await stopServer(true);
  await new Promise((r) => setTimeout(r, 3000));
  await startServer();
  return { restarted: true };
}
