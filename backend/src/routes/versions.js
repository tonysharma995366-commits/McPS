import { Router } from "express";
import * as versions from "../minecraft/versions.js";
import * as geyser from "../minecraft/geyser.js";
import { logger as log } from "../utils/logger.js";
import { restartServer } from "../minecraft/server.js";

const router = Router();

// GET /api/versions
router.get("/", async (req, res) => {
  try {
    const current = await versions.getCurrentVersion();
    const updates = await versions.getAvailableUpdates();
    const paperVersions = await versions.listPaperVersions();
    const geyserStatus = await geyser.getGeyserStatus();

    res.json({
      current,
      updates,
      paper: {
        versions: paperVersions,
      },
      geyser: geyserStatus,
    });
  } catch (err) {
    log.error("Failed to get versions summary:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch versions" });
  }
});

// GET /api/versions/paper/versions
router.get("/paper/versions", async (req, res) => {
  try {
    const list = await versions.listPaperVersions();
    res.json({ versions: list });
  } catch (err) {
    log.error("Failed to list paper versions:", err.message);
    res.status(500).json({ error: err.message || "Failed to list paper versions" });
  }
});

// GET /api/versions/paper/builds/:version
router.get("/paper/builds/:version", async (req, res) => {
  try {
    const { version } = req.params;
    const builds = await versions.listBuildsForVersion(version);
    res.json({ builds });
  } catch (err) {
    log.error(`Failed to list builds for ${req.params.version}:`, err.message);
    res.status(500).json({ error: err.message || "Failed to list builds" });
  }
});

// POST /api/versions/paper/set
router.post("/paper/set", async (req, res) => {
  try {
    const { version, build } = req.body;
    if (!version || !build) {
      return res.status(400).json({ error: "Version and build are required" });
    }
    const result = await versions.setPaperVersion(version, build);
    res.json(result);
  } catch (err) {
    log.error("Failed to set paper version:", err.message);
    res.status(500).json({ error: err.message || "Failed to set paper version" });
  }
});

// GET /api/versions/geyser/status
router.get("/geyser/status", async (req, res) => {
  try {
    const status = await geyser.getGeyserStatus();
    res.json(status);
  } catch (err) {
    log.error("Failed to get Geyser status:", err.message);
    res.status(500).json({ error: err.message || "Failed to get Geyser status" });
  }
});

// POST /api/versions/geyser/install
router.post("/geyser/install", async (req, res) => {
  try {
    const result = await geyser.installGeyser();
    res.json(result);
  } catch (err) {
    log.error("Failed to install Geyser:", err.message);
    res.status(500).json({ error: err.message || "Failed to install Geyser" });
  }
});

// POST /api/versions/geyser/uninstall
router.post("/geyser/uninstall", async (req, res) => {
  try {
    const result = await geyser.uninstallGeyser();
    res.json(result);
  } catch (err) {
    log.error("Failed to uninstall Geyser:", err.message);
    res.status(500).json({ error: err.message || "Failed to uninstall Geyser" });
  }
});

// POST /api/versions/geyser/config
router.post("/geyser/config", async (req, res) => {
  try {
    const result = await geyser.updateGeyserConfig(req.body);
    res.json(result);
  } catch (err) {
    log.error("Failed to update Geyser config:", err.message);
    res.status(500).json({ error: err.message || "Failed to update Geyser config" });
  }
});

// POST /api/versions/restart
router.post("/restart", async (req, res) => {
  try {
    await restartServer();
    res.json({ success: true, message: "Server restarting..." });
  } catch (err) {
    log.error("Failed to restart server:", err.message);
    res.status(500).json({ error: err.message || "Failed to restart server" });
  }
});

export default router;
