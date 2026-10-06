import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "./config.js";
import { log } from "./logger.js";
import * as rcon from "./rcon.js";
import * as playitAgent from "./playit/agent.js";
import { attach as attachLogsWs } from "./websocket/logs.js";
import { ensureDir } from "./utils/files.js";
import apiRouter from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Core middlewares
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: true, credentials: true }));

// 2. Lightweight HTTP request logger (non-test environment)
if (CONFIG.env !== "test") {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      // Skip frequent ping logging in production
      if (req.originalUrl === "/api/ping" && res.statusCode === 200) return;
      log.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// 3. Mount API routes at /api
app.use("/api", apiRouter);

// 4. Serve static frontend build if present (e.g. ../../frontend/dist or ../../dist)
const potentialDistPaths = [
  path.resolve(__dirname, "../../frontend/dist"),
  path.resolve(__dirname, "../../dist"),
];

const distPath = potentialDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  app.use(
    express.static(distPath, {
      maxAge: "1h",
      index: false,
    })
  );

  // SPA fallback — only for non-API and non-WS routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/ws")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });

  log.info(`Serving frontend from ${distPath}`);
} else {
  log.warn("No frontend build found — API-only mode");
}

// 5. 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// 6. Global error handler
app.use((err, req, res, next) => {
  log.error(`Unhandled request error on ${req.method} ${req.url}:`, err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
});

// 7. Boot verification
async function checkEnvironment() {
  const pluginsDir = path.join(CONFIG.mc.dir, "plugins");
  const pluginsDisabledDir = path.join(CONFIG.mc.dir, "plugins-disabled");
  const backupsDir = CONFIG.backup.dir;

  log.info(`Resolved Minecraft directory: ${CONFIG.mc.dir}`);
  log.info(`Resolved Plugins directory: ${pluginsDir}`);
  log.info(`Resolved Disabled Plugins directory: ${pluginsDisabledDir}`);
  log.info(`Resolved Backups directory: ${backupsDir}`);
  log.info(`Resolved Minecraft log file: ${CONFIG.mc.logFile}`);

  await ensureDir(CONFIG.mc.dir);
  await ensureDir(pluginsDir);
  await ensureDir(pluginsDisabledDir);
  await ensureDir(backupsDir);

  // Redacted configuration overview for audit
  const sanitizedConfig = {
    port: CONFIG.port,
    env: CONFIG.env,
    mc: {
      dir: CONFIG.mc.dir,
      version: CONFIG.mc.version,
      ramMin: CONFIG.mc.ramMin,
      ramMax: CONFIG.mc.ramMax,
      serverPort: CONFIG.mc.serverPort,
      logFile: CONFIG.mc.logFile,
    },
    rcon: {
      host: CONFIG.rcon.host,
      port: CONFIG.rcon.port,
      password: CONFIG.rcon.password ? "[REDACTED]" : "[UNSET]",
    },
    backup: CONFIG.backup,
    playit: {
      apiUrl: CONFIG.playit.apiUrl,
      secret: CONFIG.playit.secret ? "[REDACTED]" : "[UNSET]",
    },
    apiKey: CONFIG.apiKey ? "[SET]" : "[UNSET]",
  };

  log.info("Resolved Configuration:", JSON.stringify(sanitizedConfig, null, 2));
}

// 8. Start server and attach WebSocket
await checkEnvironment();

const server = app.listen(CONFIG.port, "0.0.0.0", () => {
  log.info(`Backend listening on 0.0.0.0:${CONFIG.port}`);
  log.info(`Environment: ${CONFIG.env}`);
  if (CONFIG.env === "production") {
    log.info("Public domain auto-assigned by Railway");
  }

  // Attach WebSocket server for live logs on /ws/logs
  attachLogsWs(server);

  // Fire-and-forget non-blocking RCON connection attempt
  rcon.connect().then((conn) => {
    if (conn) {
      log.info("Initial RCON connection established");
    } else {
      log.debug("Initial RCON connection deferred (Minecraft server may still be initializing)");
    }
  }).catch((err) => {
    log.debug(`Initial RCON connection error: ${err.message}`);
  });

  // Fire-and-forget Playit agent process initialization
  log.info("Playit agent starting...");
  playitAgent.start().catch((err) => {
    log.warn(`Playit agent startup notice: ${err.message}`);
  });
});

// 9. Graceful shutdown handler
function handleShutdown(signal) {
  log.info(`Received ${signal}. Shutting down backend gracefully...`);
  rcon.disconnect();
  playitAgent.stop().catch(() => {});

  server.close(() => {
    log.info("HTTP server closed cleanly.");
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    log.error("Graceful shutdown timeout exceeded. Forcing process exit.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

export default app;
