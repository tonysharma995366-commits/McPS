import { WebSocketServer, WebSocket } from "ws";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import * as logReader from "../minecraft/logReader.js";

const MAX_CLIENTS = 10;
const HEARTBEAT_INTERVAL_MS = 30000;
const MAX_MESSAGES_PER_SEC = 20;

let wss = null;
const clients = new Set();
let fileWatcher = null;
let lastFileOffset = 0;
let pollTimer = null;

function broadcast(payloadObj) {
  const jsonStr = JSON.stringify(payloadObj);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(jsonStr);
      } catch {
        // ignore send error
      }
    }
  }
}

/**
 * Reads newly appended lines since lastFileOffset and broadcasts them.
 */
async function processNewLogBytes() {
  if (clients.size === 0) return;

  try {
    if (!fs.existsSync(CONFIG.mc.logFile)) {
      lastFileOffset = 0;
      return;
    }

    const stats = await fsp.stat(CONFIG.mc.logFile);
    if (stats.size < lastFileOffset) {
      // Log file was truncated or rotated
      lastFileOffset = 0;
    }

    if (stats.size === lastFileOffset) {
      return;
    }

    const bytesToRead = stats.size - lastFileOffset;
    if (bytesToRead <= 0) return;

    // Read up to 256KB per tick to prevent buffer overload
    const chunkBytes = Math.min(bytesToRead, 262144);
    const buffer = Buffer.alloc(chunkBytes);

    const fd = await fsp.open(CONFIG.mc.logFile, "r");
    try {
      await fd.read(buffer, 0, chunkBytes, lastFileOffset);
      lastFileOffset += chunkBytes;
    } finally {
      await fd.close();
    }

    const newText = buffer.toString("utf-8");
    const rawLines = newText.split("\n");

    for (const raw of rawLines) {
      const parsed = logReader.parseLine(raw);
      if (parsed) {
        broadcast({ type: "log", line: parsed });
      }
    }
  } catch (err) {
    log.debug(`Log reader tick error: ${err.message}`);
  }
}

function startLogWatcher() {
  if (pollTimer) return;

  // Initialize offset to current file end
  try {
    if (fs.existsSync(CONFIG.mc.logFile)) {
      const stats = fs.statSync(CONFIG.mc.logFile);
      lastFileOffset = stats.size;
    }
  } catch {
    lastFileOffset = 0;
  }

  // Poll every 1s for new log chunks
  pollTimer = setInterval(processNewLogBytes, 1000);

  // Also setup fs.watch if possible for instant response
  try {
    if (fs.existsSync(CONFIG.mc.logFile)) {
      fileWatcher = fs.watch(CONFIG.mc.logFile, { persistent: false }, () => {
        processNewLogBytes().catch(() => {});
      });
    }
  } catch {
    // Fallback to interval timer
  }
}

function stopLogWatcher() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (fileWatcher) {
    try {
      fileWatcher.close();
    } catch {
      // ignore
    }
    fileWatcher = null;
  }
}

/**
 * Attaches the WebSocket server to the Express HTTP Server on path /ws/logs.
 *
 * @param {import("node:http").Server} server
 */
export function attach(server) {
  wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1024 * 1024, // 1 MB
  });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);

    if (pathname === "/ws/logs") {
      if (clients.size >= MAX_CLIENTS) {
        socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
        socket.destroy();
        log.warn("Rejected WS connection: max client limit reached (10)");
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (ws) => {
    clients.add(ws);
    log.info(`WebSocket client connected to /ws/logs (Total active: ${clients.size})`);

    // Client rate limiter tracking
    let msgCount = 0;
    const rateLimitTimer = setInterval(() => {
      msgCount = 0;
    }, 1000);

    // Heartbeat ping timer
    const pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Start watching log file when first client connects
    if (clients.size === 1) {
      startLogWatcher();
    }

    // 1. Initial burst: send last 100 lines + ready
    try {
      if (!fs.existsSync(CONFIG.mc.logFile)) {
        ws.send(JSON.stringify({ type: "waiting" }));
      } else {
        const recentLines = await logReader.tailLines(100);
        for (const line of recentLines) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "log", line }));
          }
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ready" }));
        }
      }
    } catch (err) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "error", message: err.message }));
      }
    }

    // 2. Incoming messages handling
    ws.on("message", (data) => {
      msgCount++;
      if (msgCount > MAX_MESSAGES_PER_SEC) {
        ws.close(1008, "Rate limit exceeded");
        return;
      }

      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore non-json messages
      }
    });

    // 3. Disconnect cleanup
    const cleanUp = () => {
      clearInterval(rateLimitTimer);
      clearInterval(pingTimer);
      clients.delete(ws);
      log.info(`WebSocket client disconnected from /ws/logs (Remaining: ${clients.size})`);
      if (clients.size === 0) {
        stopLogWatcher();
      }
    };

    ws.on("close", cleanUp);
    ws.on("error", cleanUp);
  });

  return wss;
}
