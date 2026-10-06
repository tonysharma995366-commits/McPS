import { Router } from "express";
import healthRouter from "./health.js";
import consoleRouter from "./console.js";
import playersRouter from "./players.js";
import systemRouter from "./system.js";
import playitRouter from "./playit.js";
import pluginsRouter from "./plugins.js";
import backupsRouter from "./backups.js";
import worldRouter from "./world.js";
import propertiesRouter from "./properties.js";

const apiRouter = Router();

// ── Health & Diagnostic Routes ──
apiRouter.use("/", healthRouter);

// ── Console, Logs & Status Routes (/api/console, /api/logs, /api/status) ──
apiRouter.use("/", consoleRouter);

// ── Players Management Routes (/api/players/*) ──
apiRouter.use("/players", playersRouter);

// ── System Diagnostics & Checks (/api/system/checks) ──
apiRouter.use("/system", systemRouter);

// ── Playit.gg Tunnel Routes (/api/playit/*) ──
apiRouter.use("/playit", playitRouter);

// ── Plugins Management Routes (/api/plugins/*) ──
apiRouter.use("/plugins", pluginsRouter);

// ── World Backups Management Routes (/api/backups/*) ──
apiRouter.use("/backups", backupsRouter);

// ── World & Game Rules Routes (/api/world/*) ──
apiRouter.use("/world", worldRouter);

// ── Server Properties Routes (/api/properties/*) ──
apiRouter.use("/properties", propertiesRouter);

export default apiRouter;
