import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load environment variables from .env if present
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global frozen configuration object for MC RailAdmin backend.
 */
export const CONFIG = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || "development",

  mc: {
    dir: process.env.MC_DIR || "/app/minecraft",
    version: process.env.MC_VERSION || "1.20.4",
    ramMin: process.env.MC_RAM_MIN || "512M",
    ramMax: process.env.MC_RAM_MAX || "1536M",
    serverPort: Number(process.env.MC_SERVER_PORT) || 25565,
    logFile: process.env.LOG_FILE || "/app/minecraft/logs/console.log",
    pidFile: "/app/minecraft/mc.pid",
  },

  rcon: {
    host: process.env.RCON_HOST || "127.0.0.1",
    port: Number(process.env.RCON_PORT) || 25575,
    password: process.env.RCON_PASSWORD || "changeme",
  },

  backup: {
    dir: process.env.BACKUP_DIR || "/app/minecraft/backups",
  },

  playit: {
    apiUrl: process.env.PLAYIT_API_URL || "https://api.playit.gg",
    secret: process.env.PLAYIT_SECRET || "",
  },

  apiKey: process.env.API_KEY || "",
});

export const PATHS = Object.freeze({
  root: path.resolve(__dirname, "../../"),
  backend: path.resolve(__dirname, "../"),
  src: __dirname,
});
