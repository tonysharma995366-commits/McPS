import fs from "node:fs";
import fsp from "node:fs/promises";
import crypto from "node:crypto";
import { CONFIG } from "../config.js";

function quickHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parses a single line from Minecraft console/server.log.
 *
 * @param {string} rawLine
 * @returns {{ id: string, timestamp: string, level: string, message: string, isChat?: boolean }}
 */
export function parseLine(rawLine) {
  const line = rawLine.trimEnd();
  if (!line) return null;

  // Regex pattern for standard Paper/Spigot/Vanilla logs:
  // e.g. [14:32:10] [Server thread/INFO]: [Essentials] Loading Essentials v2.20.1
  // e.g. [14:32:10 INFO]: Loading properties
  const standardMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s+\[(?:[^\]]+\/)?(INFO|WARN|WARNING|ERROR|FATAL|DEBUG)\]:\s*(.*)$/i);

  if (standardMatch) {
    const [, timeStr, rawLevel, msg] = standardMatch;
    let level = rawLevel.toUpperCase();
    if (level === "WARNING") level = "WARN";

    // Detect player chat messages: <Steve> Hello world!
    const isChat = /^<[^>]+>\s+/.test(msg);
    if (isChat) {
      level = "CHAT";
    }

    const todayIso = new Date().toISOString().split("T")[0];
    const fullTimestamp = `${todayIso}T${timeStr}.000Z`;

    return {
      id: `${timeStr}-${quickHash(msg)}`,
      timestamp: fullTimestamp,
      level,
      message: msg,
      isChat,
    };
  }

  // Fallback for multi-line stack traces or unformatted lines
  const nowIso = new Date().toISOString();
  return {
    id: `log-${Date.now()}-${quickHash(line)}`,
    timestamp: nowIso,
    level: "INFO",
    message: line,
  };
}

/**
 * Reads the last N lines from the server log file efficiently.
 *
 * @param {number} [n=200] - Number of lines to return
 * @returns {Promise<Array<{ id: string, timestamp: string, level: string, message: string }>>}
 */
export async function tailLines(n = 200) {
  try {
    if (!fs.existsSync(CONFIG.mc.logFile)) {
      return [];
    }

    const stats = await fsp.stat(CONFIG.mc.logFile);
    if (stats.size === 0) return [];

    // Estimate byte size (avg ~120 bytes per log line * N * 2 safety factor)
    const bytesToRead = Math.min(stats.size, Math.max(65536, n * 250));
    const startPos = Math.max(0, stats.size - bytesToRead);

    const buffer = Buffer.alloc(bytesToRead);
    const fd = await fsp.open(CONFIG.mc.logFile, "r");

    try {
      await fd.read(buffer, 0, bytesToRead, startPos);
    } finally {
      await fd.close();
    }

    const text = buffer.toString("utf-8");
    const rawLines = text.split("\n");

    // If we didn't start at the very beginning of the file, drop first partial line
    if (startPos > 0 && rawLines.length > 0) {
      rawLines.shift();
    }

    const parsed = [];
    for (let i = rawLines.length - 1; i >= 0 && parsed.length < n; i--) {
      const item = parseLine(rawLines[i]);
      if (item) {
        parsed.unshift(item);
      }
    }

    return parsed;
  } catch (err) {
    return [
      {
        id: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "WARN",
        message: `Unable to read log file: ${err.message}`,
      },
    ];
  }
}
