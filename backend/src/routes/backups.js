import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";
import * as backups from "../minecraft/backups.js";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import { safeJoin, dirSizeBytes } from "../utils/files.js";

const router = Router();

/**
 * GET /api/backups
 */
router.get("/", async (req, res) => {
  try {
    const list = await backups.listBackups();
    const auto = await backups.getAutoSettings();
    const usedBytes = await dirSizeBytes(CONFIG.backup.dir);
    const usedGb = Number((usedBytes / (1024 * 1024 * 1024)).toFixed(1));

    res.json({
      storage: {
        used: usedGb,
        total: 5.0,
      },
      auto,
      list,
    });
  } catch (err) {
    log.error("Failed to list backups:", err.message);
    res.status(500).json({ error: err.message || "Failed to load backups" });
  }
});

/**
 * POST /api/backups
 */
router.post("/", async (req, res) => {
  try {
    const { name, type } = req.body || {};
    const result = await backups.createBackup(name, type || "manual");
    res.json({ success: true, backup: result });
  } catch (err) {
    log.error("Failed to create backup:", err.message);
    res.status(500).json({ error: err.message || "Failed to create backup" });
  }
});

/**
 * POST /api/backups/:id/restore
 */
router.post("/:id/restore", async (req, res) => {
  try {
    const result = await backups.restoreBackup(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    log.error("Failed to restore backup:", err.message);
    res.status(500).json({ error: err.message || "Failed to restore backup" });
  }
});

/**
 * GET /api/backups/:id/download
 * Streams backup world directory as a .zip file.
 */
router.get("/:id/download", async (req, res) => {
  try {
    const list = await backups.listBackups();
    const backup = list.find((b) => b.id === req.params.id);

    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    const backupWorldDir = safeJoin(path.join(CONFIG.backup.dir, backup.id), "world");
    if (!fs.existsSync(backupWorldDir)) {
      return res.status(404).json({ error: "Backup world files not found" });
    }

    const filename = `${backup.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const archive = archiver("zip", { zlib: { level: 6 } });

    archive.on("error", (err) => {
      log.error("Archive stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Archiving error" });
      }
    });

    archive.pipe(res);
    archive.directory(backupWorldDir, false);
    await archive.finalize();
  } catch (err) {
    log.error("Download backup error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Failed to stream backup archive" });
    }
  }
});

/**
 * PATCH /api/backups/:id
 */
router.patch("/:id", async (req, res) => {
  try {
    const { name } = req.body || {};
    const backup = await backups.renameBackup(req.params.id, name);
    res.json({ success: true, backup });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to rename backup" });
  }
});

/**
 * POST /api/backups/:id/duplicate
 */
router.post("/:id/duplicate", async (req, res) => {
  try {
    const clone = await backups.duplicateBackup(req.params.id);
    res.json({ success: true, backup: clone });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to duplicate backup" });
  }
});

/**
 * POST /api/backups/:id/lock
 */
router.post("/:id/lock", async (req, res) => {
  try {
    const { locked } = req.body || {};
    const backup = await backups.setLock(req.params.id, locked);
    res.json({ success: true, backup });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to set backup lock" });
  }
});

/**
 * DELETE /api/backups/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await backups.deleteBackup(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete backup" });
  }
});

/**
 * POST /api/backups/auto
 */
router.post("/auto", async (req, res) => {
  try {
    const auto = await backups.setAutoSettings(req.body || {});
    res.json({ success: true, auto });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update auto-backup config" });
  }
});

/**
 * DELETE /api/backups/bulk
 */
router.delete("/bulk", async (req, res) => {
  try {
    const { filter } = req.body || {};
    const result = await backups.bulkDelete(filter || "keep5");
    res.json({ success: true, deletedCount: result.deleted, list: result.list });
  } catch (err) {
    res.status(500).json({ error: err.message || "Bulk deletion failed" });
  }
});

export default router;
