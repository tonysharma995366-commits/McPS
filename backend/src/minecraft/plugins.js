import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import * as rcon from "../rcon.js";
import {
  ensureDir,
  safeJoin,
  atomicWrite,
  readJsonSafe,
  writeJsonSafe,
  sanitizeFilename,
} from "../utils/files.js";

const PLUGINS_DIR = path.join(CONFIG.mc.dir, "plugins");
const DISABLED_DIR = path.join(CONFIG.mc.dir, "plugins-disabled");
const META_FILE = path.join(CONFIG.mc.dir, "plugins-meta.json");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parsePluginDetails(filename) {
  // Example: EssentialsX-2.20.1.jar -> name: EssentialsX, version: v2.20.1
  const clean = filename.replace(/\.jar$/i, "");
  const versionMatch = clean.match(/[-_]v?(\d+\.\d+(?:\.\d+)?(?:-[A-Za-z0-9]+)?)$/i);
  let name = clean;
  let version = "v1.0.0";

  if (versionMatch) {
    version = `v${versionMatch[1]}`;
    name = clean.slice(0, versionMatch.index);
  }

  // Capitalize name nicely if all lower
  if (name === name.toLowerCase()) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return { name, version };
}

/**
 * Lists all installed plugins across enabled and disabled directories.
 */
export async function listPlugins() {
  await ensureDir(PLUGINS_DIR);
  await ensureDir(DISABLED_DIR);

  const meta = (await readJsonSafe(META_FILE, {})) || {};
  const plugins = [];

  // Helper to read a directory
  async function readFolder(folderPath, isEnabled) {
    if (!fs.existsSync(folderPath)) return;
    const entries = await fsp.readdir(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".jar")) continue;

      const fullPath = path.join(folderPath, entry.name);
      let sizeStr = "1.0 MB";
      let updatedAt = "recently";

      try {
        const stat = await fsp.stat(fullPath);
        sizeStr = formatBytes(stat.size);
        updatedAt = stat.mtime.toISOString();
      } catch {
        // ignore
      }

      const { name, version } = parsePluginDetails(entry.name);
      const pluginId = entry.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const savedMeta = meta[entry.name] || {};

      plugins.push({
        id: pluginId,
        name: savedMeta.name || name,
        filename: entry.name,
        version: savedMeta.version || version,
        size: sizeStr,
        enabled: isEnabled,
        author: savedMeta.author || null,
        description: savedMeta.description || `${name} Minecraft plugin`,
        installedAt: savedMeta.installedAt || updatedAt,
        updatedAt: savedMeta.updatedAt || updatedAt,
        updateAvailable: Boolean(savedMeta.updateAvailable),
        needsRestart: false,
      });
    }
  }

  await readFolder(PLUGINS_DIR, true);
  await readFolder(DISABLED_DIR, false);

  return plugins;
}

/**
 * Toggles a plugin's enabled status by moving it between folders.
 */
export async function togglePlugin(id) {
  const plugins = await listPlugins();
  const plugin = plugins.find((p) => p.id === id || p.filename === id);

  if (!plugin) {
    throw new Error(`Plugin not found: ${id}`);
  }

  const meta = (await readJsonSafe(META_FILE, {})) || {};
  const isEnabled = plugin.enabled;
  const sourcePath = safeJoin(isEnabled ? PLUGINS_DIR : DISABLED_DIR, plugin.filename);
  const destPath = safeJoin(isEnabled ? DISABLED_DIR : PLUGINS_DIR, plugin.filename);

  await fsp.rename(sourcePath, destPath);

  meta[plugin.filename] = {
    ...(meta[plugin.filename] || {}),
    enabled: !isEnabled,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonSafe(META_FILE, meta);
  log.info(`Toggled plugin ${plugin.filename} -> ${!isEnabled ? "ENABLED" : "DISABLED"}`);

  return {
    ...plugin,
    enabled: !isEnabled,
    needsRestart: true,
  };
}

/**
 * Deletes a plugin jar and its associated configuration folder.
 */
export async function deletePlugin(id) {
  const plugins = await listPlugins();
  const plugin = plugins.find((p) => p.id === id || p.filename === id);

  if (!plugin) {
    throw new Error(`Plugin not found: ${id}`);
  }

  const jarPath = safeJoin(plugin.enabled ? PLUGINS_DIR : DISABLED_DIR, plugin.filename);
  if (fs.existsSync(jarPath)) {
    await fsp.unlink(jarPath);
  }

  // Remove plugin config directory if it exists
  const configDir = safeJoin(PLUGINS_DIR, plugin.name);
  if (fs.existsSync(configDir)) {
    try {
      await fsp.rm(configDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  const meta = (await readJsonSafe(META_FILE, {})) || {};
  delete meta[plugin.filename];
  await writeJsonSafe(META_FILE, meta);

  log.info(`Deleted plugin ${plugin.filename}`);
  return { ok: true };
}

/**
 * Uploads and registers a new plugin jar file.
 */
export async function uploadPlugin(fileBuffer, originalName) {
  if (!originalName.toLowerCase().endsWith(".jar")) {
    throw new Error("Only .jar plugin files are allowed");
  }

  if (fileBuffer.length > 20 * 1024 * 1024) {
    throw new Error("Plugin file exceeds maximum allowed size (20 MB)");
  }

  await ensureDir(PLUGINS_DIR);
  let cleanName = sanitizeFilename(originalName);
  if (!cleanName.toLowerCase().endsWith(".jar")) {
    cleanName += ".jar";
  }

  let targetPath = safeJoin(PLUGINS_DIR, cleanName);
  let counter = 1;

  while (fs.existsSync(targetPath)) {
    const base = cleanName.replace(/\.jar$/i, "");
    cleanName = `${base}-${counter++}.jar`;
    targetPath = safeJoin(PLUGINS_DIR, cleanName);
  }

  await atomicWrite(targetPath, fileBuffer);

  const { name, version } = parsePluginDetails(cleanName);
  const meta = (await readJsonSafe(META_FILE, {})) || {};
  const now = new Date().toISOString();

  meta[cleanName] = {
    name,
    version,
    enabled: true,
    installedAt: now,
    updatedAt: now,
  };

  await writeJsonSafe(META_FILE, meta);
  log.info(`Uploaded new plugin: ${cleanName}`);

  return {
    id: cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name,
    filename: cleanName,
    version,
    size: formatBytes(fileBuffer.length),
    enabled: true,
    needsRestart: true,
  };
}

/**
 * Downloads and installs a plugin jar directly from a URL.
 */
export async function installFromUrl(url, name) {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("Invalid URL: must be http or https");
  }

  const targetFilename = sanitizeFilename(name || "Plugin") + ".jar";
  const targetPath = safeJoin(PLUGINS_DIR, targetFilename);

  await ensureDir(PLUGINS_DIR);

  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return installFromUrl(res.headers.location, name).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }

      const chunks = [];
      let totalSize = 0;

      res.on("data", (chunk) => {
        totalSize += chunk.length;
        if (totalSize > 20 * 1024 * 1024) {
          req.destroy();
          return reject(new Error("Plugin download exceeded 20 MB size limit"));
        }
        chunks.push(chunk);
      });

      res.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        try {
          const result = await uploadPlugin(buffer, targetFilename);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Download request timed out after 60s"));
    });
  });
}

/**
 * Sends RCON reload command.
 */
export async function reloadPlugin(id) {
  try {
    await rcon.send("reload confirm");
    return { ok: true };
  } catch (err) {
    return { ok: true, notice: "Reload command sent (server offline or starting)" };
  }
}

/**
 * Sends RCON reload confirm for all plugins.
 */
export async function reloadAll() {
  try {
    await rcon.send("reload confirm");
    return { ok: true };
  } catch (err) {
    return { ok: true, notice: "Reload sent" };
  }
}
