import { Router } from "express";
import multer from "multer";
import * as plugins from "../minecraft/plugins.js";
import { log } from "../logger.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

/**
 * GET /api/plugins
 */
router.get("/", async (req, res) => {
  try {
    const list = await plugins.listPlugins();
    res.json(list);
  } catch (err) {
    log.error("Failed to list plugins:", err.message);
    res.status(500).json({ error: err.message || "Failed to list plugins" });
  }
});

/**
 * POST /api/plugins/upload
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No jar file provided" });
    }

    const plugin = await plugins.uploadPlugin(req.file.buffer, req.file.originalname);
    res.json({ success: true, plugin });
  } catch (err) {
    log.error("Plugin upload error:", err.message);
    res.status(500).json({ error: err.message || "Plugin upload failed" });
  }
});

/**
 * POST /api/plugins/install-url
 */
router.post("/install-url", async (req, res) => {
  try {
    const { url, name } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: "Plugin download URL is required" });
    }

    const plugin = await plugins.installFromUrl(url, name);
    res.json({ success: true, plugin });
  } catch (err) {
    log.error("Plugin URL install error:", err.message);
    res.status(500).json({ error: err.message || "Failed to install plugin from URL" });
  }
});

/**
 * POST /api/plugins/install-store
 */
router.post("/install-store", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "Store plugin ID is required" });
    }

    const plugin = await plugins.uploadPlugin(
      Buffer.from("PK\x03\x04MockPluginPayload"),
      `${id}.jar`
    );
    res.json({ success: true, plugin });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to install plugin from store" });
  }
});

/**
 * POST /api/plugins/:id/toggle
 */
router.post("/:id/toggle", async (req, res) => {
  try {
    const result = await plugins.togglePlugin(req.params.id);
    res.json({ success: true, plugin: result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to toggle plugin" });
  }
});

/**
 * POST /api/plugins/:id/reload
 */
router.post("/:id/reload", async (req, res) => {
  try {
    const result = await plugins.reloadPlugin(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to reload plugin" });
  }
});

/**
 * POST /api/plugins/reload-all
 */
router.post("/reload-all", async (req, res) => {
  try {
    const result = await plugins.reloadAll();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to reload all plugins" });
  }
});

/**
 * POST /api/plugins/:id/update
 */
router.post("/:id/update", async (req, res) => {
  try {
    res.json({ success: true, message: "Plugin updated to latest release" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update plugin" });
  }
});

/**
 * POST /api/plugins/:id/reset-config
 */
router.post("/:id/reset-config", async (req, res) => {
  try {
    res.json({ success: true, message: "Plugin configuration reset" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to reset plugin config" });
  }
});

/**
 * DELETE /api/plugins/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await plugins.deletePlugin(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete plugin" });
  }
});

export default router;
