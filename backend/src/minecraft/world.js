import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import * as rcon from "../rcon.js";
import * as properties from "./properties.js";
import * as backups from "./backups.js";
import * as processManager from "./process.js";
import { dirSizeBytes, safeJoin } from "../utils/files.js";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const COMMON_GAMERULES = [
  "keepInventory",
  "doDaylightCycle",
  "doMobSpawning",
  "mobGriefing",
  "pvp",
  "doWeatherCycle",
  "doFireTick",
  "naturalRegeneration",
  "showDeathMessages",
  "doTileDrops",
  "randomTickSpeed",
  "playersSleepingPercentage",
  "spawnRadius",
];

/**
 * Gets high-level world metadata.
 */
export async function getWorldInfo() {
  const props = await properties.readProperties();
  const worldName = props["level-name"] || "world";
  const worldDir = path.join(CONFIG.mc.dir, worldName);

  let sizeBytes = 0;
  if (fs.existsSync(worldDir)) {
    sizeBytes = await dirSizeBytes(worldDir);
  }

  const backupList = await backups.listBackups();
  const latestBackup = backupList.length > 0 ? backupList[0].createdAt : null;

  return {
    name: worldName,
    size: formatBytes(sizeBytes),
    sizeBytes,
    seed: props["level-seed"] || "Random",
    type: props["level-type"] || "minecraft:normal",
    difficulty: props["difficulty"] || "normal",
    hardcore: props["hardcore"] === "true",
    lastBackup: latestBackup,
  };
}

/**
 * Regenerates world files with an optional seed.
 */
export async function regenerateWorld(seed = null, backup = true) {
  log.info("Initiating world regeneration...");

  if (backup) {
    try {
      await backups.createBackup("Pre-Regeneration Safety", "safety");
    } catch {
      // Proceed even if safety snapshot fails
    }
  }

  // Stop server before deleting worlds
  const wasRunning = await processManager.isRunning();
  if (wasRunning) {
    await processManager.stopServer(true);
  }

  const worldNames = ["world", "world_nether", "world_the_end"];
  for (const w of worldNames) {
    const dir = safeJoin(CONFIG.mc.dir, w);
    if (fs.existsSync(dir)) {
      await fsp.rm(dir, { recursive: true, force: true });
    }
  }

  if (seed !== null && seed !== undefined && String(seed).trim() !== "") {
    await properties.setProperty("level-seed", String(seed).trim());
  }

  // Restart server to generate a clean new world
  await processManager.startServer();
  log.info("World regeneration complete, server restarted.");
  return { ok: true };
}

/**
 * Deletes current world directories without auto-starting server.
 */
export async function deleteWorld(backup = true) {
  if (backup) {
    try {
      await backups.createBackup("Pre-Delete Safety", "safety");
    } catch {
      // Proceed
    }
  }

  const wasRunning = await processManager.isRunning();
  if (wasRunning) {
    await processManager.stopServer(true);
  }

  const worldNames = ["world", "world_nether", "world_the_end"];
  for (const w of worldNames) {
    const dir = safeJoin(CONFIG.mc.dir, w);
    if (fs.existsSync(dir)) {
      await fsp.rm(dir, { recursive: true, force: true });
    }
  }

  log.info("World files deleted cleanly.");
  return { ok: true };
}

/**
 * Queries current active gamerules via RCON.
 */
export async function getGameRules() {
  const result = {
    keepInventory: false,
    doDaylightCycle: true,
    doMobSpawning: true,
    mobGriefing: true,
    pvp: true,
    doWeatherCycle: true,
    doFireTick: true,
    naturalRegeneration: true,
    showDeathMessages: true,
    doTileDrops: true,
    randomTickSpeed: 3,
    playersSleepingPercentage: 100,
    spawnRadius: 10,
  };

  try {
    for (const rule of COMMON_GAMERULES) {
      try {
        const out = await rcon.send(`gamerule ${rule}`);
        // Response format: Gamerule keepInventory is currently set to: false
        const match = out.match(/is currently set to:\s*(.*)$/i) || out.match(/:\s*(.*)$/i);
        if (match) {
          const valStr = match[1].trim().toLowerCase();
          if (valStr === "true") result[rule] = true;
          else if (valStr === "false") result[rule] = false;
          else if (!isNaN(Number(valStr))) result[rule] = Number(valStr);
          else result[rule] = match[1].trim();
        }
      } catch {
        // use fallback default
      }
    }
  } catch {
    // Return fallback defaults
  }

  return result;
}

/**
 * Updates a gamerule dynamically via RCON.
 */
export async function setGameRule(rule, value) {
  if (!rule) throw new Error("Gamerule name is required");

  const cmd = `gamerule ${rule} ${value}`;
  log.info(`Applying gamerule change: ${cmd}`);

  try {
    await rcon.send(cmd);
    return { ok: true, rule, value };
  } catch (err) {
    throw new Error(`Failed to set gamerule: ${err.message}`);
  }
}
