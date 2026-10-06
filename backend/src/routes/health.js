import { Router } from "express";
import { CONFIG } from "../config.js";

const router = Router();
const startTime = Date.now();

/**
 * Health check endpoint for Railway and container readiness checks.
 * GET /api/health
 */
router.get("/health", (req, res) => {
  res.json({
    ok: true,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: "1.0.0",
    env: CONFIG.env,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Lightweight latency/connectivity check.
 * GET /api/ping
 */
router.get("/ping", (req, res) => {
  res.json({
    pong: true,
    ts: Date.now(),
  });
});

export default router;
