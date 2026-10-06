import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { CONFIG } from "../config.js";
import * as rcon from "../rcon.js";
import * as processManager from "../minecraft/process.js";
import * as properties from "../minecraft/properties.js";
import * as playitAgent from "../playit/agent.js";
import * as metrics from "./metrics.js";

/**
 * Checks if Minecraft port is currently bound/listening.
 */
function testPortBound(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true); // Port bound by MC
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "0.0.0.0");
  });
}

/**
 * Safely tests directory writability.
 */
async function testDirWritable(dirPath) {
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
 * Executes comprehensive self-diagnostics check suite.
 */
export async function runAllChecks() {
  // 1. Minecraft Process & Integrity
  let processRunning = false;
  try {
    processRunning = await processManager.isRunning();
  } catch {
    processRunning = false;
  }

  const jarPath = path.join(CONFIG.mc.dir, "server.jar");
  let jarPresent = false;
  try {
    jarPresent = fs.existsSync(jarPath);
  } catch {
    jarPresent = false;
  }

  const eulaPath = path.join(CONFIG.mc.dir, "eula.txt");
  let eulaAccepted = false;
  try {
    if (fs.existsSync(eulaPath)) {
      const eulaText = await fsp.readFile(eulaPath, "utf-8");
      eulaAccepted = /eula\s*=\s*true/i.test(eulaText);
    }
  } catch {
    eulaAccepted = false;
  }

  let propertiesValid = false;
  try {
    const props = await properties.readProperties();
    propertiesValid = Object.keys(props).length > 0;
  } catch {
    propertiesValid = false;
  }

  const worldDir = path.join(CONFIG.mc.dir, "world");
  let worldExists = false;
  try {
    worldExists = fs.existsSync(worldDir);
  } catch {
    worldExists = false;
  }

  const portBound = await testPortBound(CONFIG.mc.serverPort);

  // Paper version check
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

  // 2. RCON Checks
  const isRconConnected = rcon.isConnected();
  let rconLatencyMs = null;
  let rconConnected = isRconConnected;

  if (isRconConnected) {
    const start = Date.now();
    try {
      await rcon.send("list");
      rconLatencyMs = Date.now() - start;
      rconConnected = true;
    } catch {
      rconConnected = false;
    }
  }

  const passwordIsDefault = CONFIG.rcon.password === "changeme" || !CONFIG.rcon.password;

  // 3. Filesystem Checks
  const mcDirWritable = await testDirWritable(CONFIG.mc.dir);
  const backupDirWritable = await testDirWritable(CONFIG.backup.dir);
  let pluginsDirExists = false;
  try {
    pluginsDirExists = fs.existsSync(path.join(CONFIG.mc.dir, "plugins"));
  } catch {
    pluginsDirExists = false;
  }

  let logReadable = false;
  if (fs.existsSync(CONFIG.mc.logFile)) {
    try {
      await fsp.access(CONFIG.mc.logFile, fs.constants.R_OK);
      logReadable = true;
    } catch {
      logReadable = false;
    }
  }

  // 4. Environment Checks
  const javaVersion = await metrics.getJavaVersion();
  const nodeMetrics = metrics.getNodeMetrics();

  // 5. Playit Status
  const playitStatus = await playitAgent.status();

  return {
    mc: {
      processRunning,
      jarPresent,
      eulaAccepted,
      propertiesValid,
      worldExists,
      portBound,
      paperVersion: paperVersion || "Paper 1.20.4",
      expectedVersion: CONFIG.mc.version,
    },
    rcon: {
      connected: rconConnected,
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
      javaVersion,
      port: CONFIG.port,
      rconPasswordSet: Boolean(CONFIG.rcon.password && CONFIG.rcon.password !== "changeme"),
      mcRamMax: CONFIG.mc.ramMax,
      playitSecretSet: Boolean(CONFIG.playit.secret),
      apiKeySet: Boolean(CONFIG.apiKey),
    },
    heap: {
      usedMb: nodeMetrics.heapUsedMb,
      totalMb: nodeMetrics.heapTotalMb,
      percent: nodeMetrics.percentHeapUsed,
    },
    playit: {
      status: playitStatus.status,
      claimed: playitStatus.status === "connected",
      hasClaimUrl: Boolean(playitStatus.claimUrl),
      hasAddress: Boolean(playitStatus.address),
    },
  };
}
