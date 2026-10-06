import { Router } from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import archiver from "archiver";
import unzipper from "unzipper";
import * as worldManager from "../minecraft/world.js";
import * as backups from "../minecraft/backups.js";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import { safeJoin, ensureDir } from "../utils/files.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max for world zip
});

/**
 * GET /api/world
 */
router.get("/", async (req, res) => {
  try {
    const info = await worldManager.getWorldInfo();
    res.json(info);
  } catch (err) {
    log.error("Failed to retrieve world info:", err.message);
    res.status(500).json({ error: err.message || "Failed to load world info" });
  }
});

/**
 * POST /api/world/backup
 */
router.post("/backup", async (req, res) => {
  try {
    const backup = await backups.createBackup("Manual Snapshot", "manual");
    res.json({ success: true, backup });
  } catch (err) {
    log.error("World manual backup error:", err.message);
    res.status(500).json({ error: err.message || "Failed to create world backup" });
  }
});

/**
 * GET /api/world/download
 * Streams live world directory as a .zip file.
 */
router.get("/download", async (req, res) => {
  try {
    const worldDir = path.join(CONFIG.mc.dir, "world");
    if (!fs.existsSync(worldDir)) {
      return res.status(404).json({ error: "World directory not found" });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="world.zip"');

    const archive = archiver("zip", { zlib: { level: 6 } });

    archive.on("error", (err) => {
      log.error("World zip stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Archiving error" });
      }
    });

    archive.pipe(res);
    archive.directory(worldDir, "world");
    await archive.finalize();
  } catch (err) {
    log.error("World download error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Failed to download world" });
    }
  }
});

/**
 * POST /api/world/upload
 * Accepts a .zip file, validates structure and level.dat, creates safety backup, and replaces world.
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No world zip archive uploaded" });
    }

    const tempExtractDir = path.join(CONFIG.mc.dir, `world-upload-temp-${Date.now()}`);
    await ensureDir(tempExtractDir);

    // Parse zip archive with strict path traversal checking
    const directory = await unzipper.Open.buffer(req.file.buffer);
    for (const file of directory.files) {
      const sanitized = file.path.replace(/\.\./g, "").replace(/^[/\\]+/, "");
      const fullDestPath = safeJoin(tempExtractDir, sanitized);

      if (file.type === "Directory") {
        await ensureDir(fullDestPath);
      } else {
        await ensureDir(path.dirname(fullDestPath));
        const content = await file.buffer();
        await fsp.writeFile(fullDestPath, content);
      }
    }

    // Verify level.dat exists in root or nested world/ folder
    let worldSourceDir = tempExtractDir;
    if (!fs.existsSync(path.join(tempExtractDir, "level.dat"))) {
      const nested = path.join(tempExtractDir, "world");
      if (fs.existsSync(path.join(nested, "level.dat"))) {
        worldSourceDir = nested;
      } else {
        await fsp.rm(tempExtractDir, { recursive: true, force: true }).catch(() => {});
        return res.status(400).json({
          error: "Invalid Minecraft world archive: missing level.dat",
        });
      }
    }

    // Create safety backup of existing world
    try {
      await backups.createBackup("Pre-Upload Safety", "safety");
    } catch {
      // ignore
    }

    // Swap world folder
    const targetWorldDir = path.join(CONFIG.mc.dir, "world");
    if (fs.existsSync(targetWorldDir)) {
      await fsp.rm(targetWorldDir, { recursive: true, force: true });
    }

    await fsp.cp(worldSourceDir, targetWorldDir, { recursive: true });
    await fsp.rm(tempExtractDir, { recursive: true, force: true }).catch(() => {});

    log.info("Uploaded and extracted new Minecraft world cleanly.");
    res.json({ success: true, message: "World uploaded and replaced successfully" });
  } catch (err) {
    log.error("World upload error:", err.message);
    res.status(500).json({ error: err.message || "Failed to upload and extract world" });
  }
});

/**
 * POST /api/world/regenerate
 */
router.post("/regenerate", async (req, res) => {
  try {
    const { seed, backup = true } = req.body || {};
    const result = await worldManager.regenerateWorld(seed, backup);
    res.json({ success: true, ...result });
  } catch (err) {
    log.error("World regeneration error:", err.message);
    res.status(500).json({ error: err.message || "Failed to regenerate world" });
  }
});

/**
 * DELETE /api/world
 */
router.delete("/", async (req, res) => {
  try {
    const { backup = true } = req.body || {};
    const result = await worldManager.deleteWorld(backup);
    res.json({ success: true, ...result });
  } catch (err) {
    log.error("World delete error:", err.message);
    res.status(500).json({ error: err.message || "Failed to delete world" });
  }
});

/**
 * GET /api/world/gamerules
 */
router.get("/gamerules", async (req, res) => {
  try {
    const rules = await worldManager.getGameRules();
    res.json(rules);
  } catch (err) {
    log.error("Get gamerules error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch gamerules" });
  }
});

/**
 * POST /api/world/gamerule
 */
router.post("/gamerule", async (req, res) => {
  try {
    const { rule, value } = req.body || {};
    const result = await worldManager.setGameRule(rule, value);
    res.json({ success: true, ...result });
  } catch (err) {
    log.error("Set gamerule error:", err.message);
    res.status(500).json({ error: err.message || "Failed to set gamerule" });
  }
});

export default router;
