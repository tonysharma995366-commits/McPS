import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

/**
 * Creates directory recursively if not already existing.
 *
 * @param {string} dirPath
 * @returns {Promise<void>}
 */
export async function ensureDir(dirPath) {
  try {
    await fsp.mkdir(dirPath, { recursive: true });
  } catch {
    // ignore if already exists
  }
}

/**
 * Computes directory total size in bytes recursively.
 * Skips individual files larger than 500 MB for safety.
 *
 * @param {string} dir
 * @returns {Promise<number>}
 */
export async function dirSizeBytes(dir) {
  try {
    if (!fs.existsSync(dir)) return 0;
    let total = 0;
    const entries = await fsp.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await dirSizeBytes(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = await fsp.stat(fullPath);
          if (stat.size <= 500 * 1024 * 1024) {
            total += stat.size;
          }
        } catch {
          // ignore unreadable file
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Safely joins path preventing path traversal outside base directory.
 *
 * @param {string} base - Base root directory
 * @param {string} relative - User-supplied relative path
 * @returns {string} Resolved safe path
 */
export function safeJoin(base, relative) {
  const cleanRelative = String(relative || "").replace(/^[/\\]+/, "");
  const resolved = path.resolve(base, cleanRelative);
  const normalizedBase = path.resolve(base);

  if (!resolved.startsWith(normalizedBase)) {
    throw new Error(`Path traversal violation: access denied to ${relative}`);
  }
  return resolved;
}

/**
 * Atomically writes content to a file using temporary file replacement.
 *
 * @param {string} filePath
 * @param {string | Buffer} contents
 * @returns {Promise<void>}
 */
export async function atomicWrite(filePath, contents) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  await fsp.writeFile(tempPath, contents);
  await fsp.rename(tempPath, filePath);
}

/**
 * Safely reads and parses JSON from disk with fallback value.
 *
 * @param {string} filePath
 * @param {any} [fallback=null]
 * @returns {Promise<any>}
 */
export async function readJsonSafe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = await fsp.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

/**
 * Safely serializes and atomically writes JSON to disk.
 *
 * @param {string} filePath
 * @param {any} data
 * @returns {Promise<void>}
 */
export async function writeJsonSafe(filePath, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  await atomicWrite(filePath, jsonStr);
}

/**
 * Sanitizes filename preventing directory traversal or invalid characters.
 *
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFilename(name) {
  const clean = String(name || "")
    .replace(/[/\\]/g, "")
    .replace(/\.\.+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);

  return clean || "file";
}
