import { Router } from "express";
import * as playitAgent from "../playit/agent.js";
import { log } from "../logger.js";

const router = Router();

/**
 * GET /api/playit
 * Retrieves real-time Playit.gg tunnel status.
 */
router.get("/", async (req, res) => {
  try {
    const s = await playitAgent.status();
    const uptimeSeconds = s.startedAt ? Math.floor((Date.now() - s.startedAt) / 1000) : 0;

    res.json({
      claimed: s.status === "connected",
      claimUrl: s.claimUrl,
      address: s.address,
      host: s.host,
      port: s.port,
      region: s.region,
      latency: s.latency,
      uptime: uptimeSeconds,
      uptimeSeconds: uptimeSeconds,
      error: s.lastError,
      status: s.status,
    });
  } catch (err) {
    log.error("Failed to retrieve Playit status:", err.message);
    res.status(500).json({ error: err.message || "Failed to get Playit status" });
  }
});

/**
 * POST /api/playit/regenerate
 * Resets local agent pairing and fetches a fresh claim URL.
 */
router.post("/regenerate", async (req, res) => {
  try {
    const result = await playitAgent.regenerate();
    res.json(result);
  } catch (err) {
    log.error("Failed to regenerate Playit claim link:", err.message);
    res.status(500).json({ error: err.message || "Failed to regenerate claim link" });
  }
});

/**
 * POST /api/playit/retry
 * Attempts connection recovery if in an error state.
 */
router.post("/retry", async (req, res) => {
  try {
    await playitAgent.stop();
    await playitAgent.start();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to retry connection" });
  }
});

/**
 * POST /api/playit/reconnect
 * Gracefully re-establishes edge gateway connectivity.
 */
router.post("/reconnect", async (req, res) => {
  try {
    await playitAgent.reconnect();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to reconnect tunnel" });
  }
});

export default router;
