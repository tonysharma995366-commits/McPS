import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import * as processManager from "./process.js";
import {
  ensureDir,
  safeJoin,
  dirSizeBytes,
  readJsonSafe,
  writeJsonSafe,
  sanitizeFilename,
} from "../utils/files.js";

const BACKUP_DIR = CONFIG.backup.dir;
const INDEX_FILE = path.join(BACKUP_DIR, "index.json");
const AUTO_FILE = path.join(BACKUP_DIR, "auto.json");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function slugify(text) {
  return String(text || "backup")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

/**
 * Lists all backups sorted by creation date descending.
 */
export async function listBackups() {
  await ensureDir(BACKUP_DIR);
  let list = (await readJsonSafe(INDEX_FILE, [])) || [];

  if (!Array.isArray(list) || list.length === 0) {
    // Scan backup directories if index is empty
    const entries = await fsp.readdir(BACKUP_DIR, { withFileTypes: true });
    list = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const metaPath = path.join(BACKUP_DIR, entry.name, "meta.json");
      const meta = await readJsonSafe(metaPath, null);
      if (meta) {
        list.push(meta);
      }
    }
  }

  // Sort descending by createdAt
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Mark latest
  list.forEach((item, idx) => {
    item.isLatest = idx === 0;
  });

  await writeJsonSafe(INDEX_FILE, list);
  return list;
}

/**
 * Creates a world backup snapshot.
 */
export async function createBackup(name, type = "manual") {
  await ensureDir(BACKUP_DIR);
  const worldDir = path.join(CONFIG.mc.dir, "world");

  if (!fs.existsSync(worldDir)) {
    throw new Error("Cannot create backup: world directory does not exist yet");
  }

  const cleanName = String(name || "").trim() || `Backup #${Date.now().toString().slice(-4)}`;
  const backupId = `backup-${Date.now()}-${slugify(cleanName)}`;
  const targetBackupDir = safeJoin(BACKUP_DIR, backupId);
  const targetWorldDir = path.join(targetBackupDir, "world");

  await ensureDir(targetBackupDir);

  // Copy world directory recursively
  await fsp.cp(worldDir, targetWorldDir, {
    recursive: true,
    preserveTimestamps: true,
  });

  const sizeBytes = await dirSizeBytes(targetWorldDir);
  const sizeStr = formatBytes(sizeBytes);

  const meta = {
    id: backupId,
    name: cleanName,
    size: sizeStr,
    sizeBytes,
    createdAt: new Date().toISOString(),
    type,
    locked: false,
    isLatest: true,
    worldName: "world",
  };

  const metaPath = path.join(targetBackupDir, "meta.json");
  await writeJsonSafe(metaPath, meta);

  const currentList = await listBackups();
  currentList.forEach((b) => (b.isLatest = false));
  currentList.unshift(meta);
  await writeJsonSafe(INDEX_FILE, currentList);

  log.info(`Created world backup: [${cleanName}] (${sizeStr})`);
  return meta;
}

/**
 * Restores a world backup with automated safety backup.
 */
export async function restoreBackup(id) {
  const list = await listBackups();
  const backup = list.find((b) => b.id === id);

  if (!backup) {
    throw new Error(`Backup not found: ${id}`);
  }

  const backupWorldDir = safeJoin(path.join(BACKUP_DIR, backup.id), "world");
  if (!fs.existsSync(backupWorldDir)) {
    throw new Error(`Backup world files missing for: ${id}`);
  }

  log.info(`Restoring backup [${backup.name}] (ID: ${id})...`);

  // 1. Create a safety snapshot of current world if present
  const currentWorldDir = path.join(CONFIG.mc.dir, "world");
  if (fs.existsSync(currentWorldDir)) {
    try {
      await createBackup(`Safety Pre-Restore (${backup.name})`, "safety");
    } catch {
      // Proceed if safety fails
    }
  }

  // 2. Stop server if running
  const wasRunning = await processManager.isRunning();
  if (wasRunning) {
    log.info("Stopping Minecraft server before world restore...");
    await processManager.stopServer(true);
  }

  // 3. Replace world folder cleanly
  if (fs.existsSync(currentWorldDir)) {
    await fsp.rm(currentWorldDir, { recursive: true, force: true });
  }

  await fsp.cp(backupWorldDir, currentWorldDir, {
    recursive: true,
    preserveTimestamps: true,
  });

  // 4. Restart server if it was previously running
  if (wasRunning) {
    log.info("Restarting Minecraft server after world restore...");
    await processManager.startServer();
  }

  log.info(`World backup [${backup.name}] restored successfully.`);
  return { ok: true };
}

/**
 * Deletes a backup snapshot.
 */
export async function deleteBackup(id, force = false) {
  const list = await listBackups();
  const index = list.findIndex((b) => b.id === id);

  if (index === -1) {
    throw new Error(`Backup not found: ${id}`);
  }

  const backup = list[index];
  if (backup.locked && !force) {
    throw new Error("Cannot delete locked backup");
  }

  const targetDir = safeJoin(BACKUP_DIR, backup.id);
  if (fs.existsSync(targetDir)) {
    await fsp.rm(targetDir, { recursive: true, force: true });
  }

  list.splice(index, 1);
  if (list.length > 0) {
    list[0].isLatest = true;
  }
  await writeJsonSafe(INDEX_FILE, list);

  log.info(`Deleted backup: [${backup.name}]`);
  return { ok: true };
}

/**
 * Renames a backup entry.
 */
export async function renameBackup(id, newName) {
  const cleanName = String(newName || "").trim();
  if (!cleanName) throw new Error("Backup name cannot be empty");

  const list = await listBackups();
  const backup = list.find((b) => b.id === id);
  if (!backup) throw new Error(`Backup not found: ${id}`);

  backup.name = cleanName;

  const metaPath = path.join(BACKUP_DIR, backup.id, "meta.json");
  await writeJsonSafe(metaPath, backup);
  await writeJsonSafe(INDEX_FILE, list);

  return backup;
}

/**
 * Duplicates an existing backup folder.
 */
export async function duplicateBackup(id) {
  const list = await listBackups();
  const original = list.find((b) => b.id === id);
  if (!original) throw new Error(`Backup not found: ${id}`);

  const newName = `${original.name} (Copy)`;
  const newId = `backup-${Date.now()}-${slugify(newName)}`;
  const sourceDir = safeJoin(BACKUP_DIR, original.id);
  const targetDir = safeJoin(BACKUP_DIR, newId);

  await fsp.cp(sourceDir, targetDir, { recursive: true });

  const newMeta = {
    ...original,
    id: newId,
    name: newName,
    createdAt: new Date().toISOString(),
    locked: false,
    isLatest: false,
  };

  const metaPath = path.join(targetDir, "meta.json");
  await writeJsonSafe(metaPath, newMeta);

  list.unshift(newMeta);
  await writeJsonSafe(INDEX_FILE, list);

  log.info(`Duplicated backup [${original.name}] -> [${newName}]`);
  return newMeta;
}

/**
 * Locks or unlocks a backup to prevent deletion.
 */
export async function setLock(id, locked) {
  const list = await listBackups();
  const backup = list.find((b) => b.id === id);
  if (!backup) throw new Error(`Backup not found: ${id}`);

  backup.locked = Boolean(locked);

  const metaPath = path.join(BACKUP_DIR, backup.id, "meta.json");
  await writeJsonSafe(metaPath, backup);
  await writeJsonSafe(INDEX_FILE, list);

  return backup;
}

/**
 * Performs bulk cleanup of unlocked backups based on filter rules.
 */
export async function bulkDelete(filter) {
  const list = await listBackups();
  let deletedCount = 0;
  const remaining = [];

  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
  let unlockedCount = 0;

  for (const item of list) {
    if (item.locked) {
      remaining.push(item);
      continue;
    }

    let shouldDelete = false;

    if (filter === "keep5") {
      unlockedCount++;
      if (unlockedCount > 5) shouldDelete = true;
    } else if (filter === "older30") {
      const itemTime = new Date(item.createdAt).getTime();
      if (itemTime < thirtyDaysAgo) shouldDelete = true;
    } else if (filter === "auto") {
      if (item.type === "auto") shouldDelete = true;
    }

    if (shouldDelete) {
      const targetDir = safeJoin(BACKUP_DIR, item.id);
      if (fs.existsSync(targetDir)) {
        await fsp.rm(targetDir, { recursive: true, force: true }).catch(() => {});
      }
      deletedCount++;
    } else {
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    remaining[0].isLatest = true;
  }

  await writeJsonSafe(INDEX_FILE, remaining);
  log.info(`Bulk deleted ${deletedCount} backup archives (${filter})`);

  return { deleted: deletedCount, list: remaining };
}

/**
 * Gets auto-backup schedule configuration.
 */
export async function getAutoSettings() {
  const fallback = {
    enabled: false,
    frequency: "Daily",
    time: "03:00",
    keep: 5,
  };
  return (await readJsonSafe(AUTO_FILE, fallback)) || fallback;
}

/**
 * Updates auto-backup schedule configuration.
 */
export async function setAutoSettings(partial = {}) {
  const current = await getAutoSettings();
  const updated = { ...current, ...partial };
  await writeJsonSafe(AUTO_FILE, updated);
  log.info(`Updated auto-backup settings: ${JSON.stringify(updated)}`);
  return updated;
}
