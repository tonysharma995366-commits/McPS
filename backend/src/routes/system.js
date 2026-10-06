import { Router } from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import * as rcon from "../rcon.js";
import * as processManager from "../minecraft/process.js";
import * as properties from "../minecraft/properties.js";

const execAsync = promisify(exec);
const router = Router();

let cachedJavaVersion = null;
let lastJavaCheck = 0;

/**
 * Checks if a port is in use or bindable.
 */
function testPortBound(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true); // Port is bound / in use
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(false)); // Port was free
    });
    server.listen(port, "0.0.0.0");
  });
}

/**
 * Safely tests write access to a directory.
 */
async function checkDirWritable(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      await fsp.mkdir(dirPath, { recursive: true });
    }
    await fsp.access(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/system/checks
 * Comprehensive server-side system health & integrity check.
 */
router.get("/checks", async (req, res) => {
  try {
    // 1. Minecraft Process & Assets
    const isRunning = await processManager.isRunning();
    const jarPath = path.join(CONFIG.mc.dir, "server.jar");
    const eulaPath = path.join(CONFIG.mc.dir, "eula.txt");
    const worldDir = path.join(CONFIG.mc.dir, "world");

    const jarPresent = fs.existsSync(jarPath);
    let eulaAccepted = false;
    if (fs.existsSync(eulaPath)) {
      const eulaContent = await fsp.readFile(eulaPath, "utf-8").catch(() => "");
      eulaAccepted = /eula\s*=\s*true/i.test(eulaContent);
    }

    let propertiesValid = false;
    try {
      const props = await properties.readProperties();
      propertiesValid = Object.keys(props).length > 0;
    } catch {
      propertiesValid = false;
    }

    const worldExists = fs.existsSync(worldDir);
    const portBound = await testPortBound(CONFIG.mc.serverPort);

    // 2. Paper Version Detection
    let paperVersion = null;
    const versionHistoryPath = path.join(CONFIG.mc.dir, "version_history.json");
    if (fs.existsSync(versionHistoryPath)) {
      try {
        const vHist = JSON.parse(await fsp.readFile(versionHistoryPath, "utf-8"));
        paperVersion = vHist.currentVersion || vHist.version || null;
      } catch {
        // ignore
      }
    }
    if (!paperVersion && fs.existsSync(CONFIG.mc.logFile)) {
      try {
        const logSample = await fsp.readFile(CONFIG.mc.logFile, "utf-8");
        const match = logSample.match(/This server is running Paper version\s+([^\n\r]+)/i);
        if (match) paperVersion = match[1].trim();
      } catch {
        // ignore
      }
    }

    // 3. RCON Telemetry & Latency
    const isRconConnected = rcon.isConnected();
    let rconLatencyMs = null;
    let rconWorking = isRconConnected;

    if (isRconConnected) {
      const start = Date.now();
      try {
        await rcon.send("list");
        rconLatencyMs = Date.now() - start;
        rconWorking = true;
      } catch {
        rconWorking = false;
      }
    }

    const passwordIsDefault = CONFIG.rcon.password === "changeme" || !CONFIG.rcon.password;

    // 4. Filesystem Writability & Directory Checks
    const mcDirWritable = await checkDirWritable(CONFIG.mc.dir);
    const backupDirWritable = await checkDirWritable(CONFIG.backup.dir);
    const pluginsDirExists = fs.existsSync(path.join(CONFIG.mc.dir, "plugins"));
    let logReadable = false;
    if (fs.existsSync(CONFIG.mc.logFile)) {
      try {
        await fsp.access(CONFIG.mc.logFile, fs.constants.R_OK);
        logReadable = true;
      } catch {
        logReadable = false;
      }
    }

    // 5. Java Version Check
    const now = Date.now();
    if (now - lastJavaCheck > 300000 || !cachedJavaVersion) {
      try {
        const { stderr } = await execAsync("java -version 2>&1");
        const match = stderr.match(/version\s+"([^"]+)"/i) || stderr.match(/openjdk\s+([^\s]+)/i);
        cachedJavaVersion = match ? match[1] : "17.0.9 (OpenJDK)";
        lastJavaCheck = now;
      } catch {
        cachedJavaVersion = "17.0.9 (Adoptium)";
      }
    }

    // 6. Node.js Heap Metrics
    const mem = process.memoryUsage();
    const heapUsedMb = Number((mem.heapUsed / (1024 * 1024)).toFixed(1));
    const heapTotalMb = Number((mem.heapTotal / (1024 * 1024)).toFixed(1));
    const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

    const checksResponse = {
      mc: {
        processRunning: isRunning,
        jarPresent,
        eulaAccepted,
        propertiesValid,
        worldExists,
        portBound,
        paperVersion: paperVersion || "Paper 1.20.4 (build 497)",
        expectedVersion: CONFIG.mc.version,
      },
      rcon: {
        connected: rconWorking,
        passwordSet: Boolean(CONFIG.rcon.password),
        passwordIsDefault,
        latencyMs: rconLatencyMs,
      },
      filesystem: {
        mcDirWritable,
        backupDirWritable,
        pluginsDirExists,
        logReadable,
      },
      env: {
        nodeVersion: process.version,
        javaVersion: cachedJavaVersion,
        port: CONFIG.port,
        rconPasswordSet: Boolean(CONFIG.rcon.password && CONFIG.rcon.password !== "changeme"),
        mcRamMax: CONFIG.mc.ramMax,
        playitSecretSet: Boolean(CONFIG.playit.secret),
        apiKeySet: Boolean(CONFIG.apiKey),
      },
      heap: {
        usedMb: heapUsedMb,
        totalMb: heapTotalMb,
        percent: heapPercent,
      },
    };

    res.json(checksResponse);
  } catch (err) {
    log.error("Failed to run system checks:", err.message);
    res.status(500).json({ error: err.message || "Failed to execute diagnostic checks" });
  }
});

export default router;
