import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { CONFIG } from "../config.js";

function getPropertiesPath() {
  return path.join(CONFIG.mc.dir, "server.properties");
}

/**
 * Reads server.properties file and returns a key-value object map.
 *
 * @returns {Promise<Record<string, string>>}
 */
export async function readProperties() {
  const filePath = getPropertiesPath();
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const content = await fsp.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const result = {};

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const eqIdx = line.indexOf("=");
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1).trim();
        if (key) {
          result[key] = value;
        }
      }
    }

    return result;
  } catch {
    return {};
  }
}

/**
 * Updates properties with partial values, preserving comments and structure.
 * Writes atomically via temporary file replacement.
 *
 * @param {Record<string, any>} partial - Properties to update or insert
 * @returns {Promise<Record<string, string>>} Complete updated properties
 */
export async function writeProperties(partial = {}) {
  const filePath = getPropertiesPath();
  const dirPath = path.dirname(filePath);
  await fsp.mkdir(dirPath, { recursive: true });

  let existingContent = "";
  if (fs.existsSync(filePath)) {
    existingContent = await fsp.readFile(filePath, "utf-8");
  }

  const lines = existingContent.split("\n");
  const touchedKeys = new Set();
  const updatedLines = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      updatedLines.push(rawLine);
      continue;
    }

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      if (key in partial) {
        updatedLines.push(`${key}=${String(partial[key])}`);
        touchedKeys.add(key);
      } else {
        updatedLines.push(rawLine);
      }
    } else {
      updatedLines.push(rawLine);
    }
  }

  // Append newly added keys that weren't present in existing file
  for (const [key, value] of Object.entries(partial)) {
    if (!touchedKeys.has(key)) {
      updatedLines.push(`${key}=${String(value)}`);
    }
  }

  const finalOutput = updatedLines.join("\n");
  const tempPath = `${filePath}.tmp.${Date.now()}`;

  await fsp.writeFile(tempPath, finalOutput, "utf-8");
  await fsp.rename(tempPath, filePath);

  return readProperties();
}

/**
 * Gets a single server property value.
 *
 * @param {string} key
 * @returns {Promise<string | null>}
 */
export async function getProperty(key) {
  const props = await readProperties();
  return props[key] ?? null;
}

/**
 * Sets a single server property value.
 *
 * @param {string} key
 * @param {any} value
 * @returns {Promise<Record<string, string>>}
 */
export async function setProperty(key, value) {
  return writeProperties({ [key]: value });
}
