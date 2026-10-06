import { Router } from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import * as rcon from "../rcon.js";
import * as properties from "../minecraft/properties.js";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";

const router = Router();

/**
 * Reads and parses a JSON file from the Minecraft server directory safely.
 */
async function readMcJson(filename) {
  try {
    const filePath = path.join(CONFIG.mc.dir, filename);
    if (!fs.existsSync(filePath)) return [];
    const content = await fsp.readFile(filePath, "utf-8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

/**
 * Executes async tasks with limited concurrency.
 */
async function mapConcurrent(items, limit, fn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);

    const clean = () => executing.delete(p);
    p.then(clean, clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

/**
 * GET /api/players/online
 * Retrieves detailed stats for currently connected players.
 */
router.get("/online", async (req, res) => {
  try {
    const props = await properties.readProperties();
    const maxPlayers = parseInt(props["max-players"], 10) || 20;

    let playerNames = [];
    try {
      const listOutput = await rcon.send("list");
      const match = listOutput.match(/players online(?::\s*(.*))?/i);
      if (match && match[1]) {
        playerNames = match[1]
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
      }
    } catch {
      // If RCON fails, return empty list
      return res.json({ online: 0, max: maxPlayers, list: [] });
    }

    const opsList = await readMcJson("ops.json");
    const opNames = new Set(opsList.map((o) => o.name?.toLowerCase()));

    // Fetch player telemetry with a concurrency limit of 5
    const list = await mapConcurrent(playerNames, 5, async (name) => {
      let ping = null;
      let gamemode = "survival";
      let health = 20;
      let xp = 0;

      try {
        const pingRaw = await rcon.send(`data get entity ${name} Ping`);
        const pingMatch = pingRaw.match(/has the following entity data:\s*(-?\d+)/i);
        if (pingMatch) ping = Math.max(0, parseInt(pingMatch[1], 10));
      } catch {
        ping = 45; // sensible default
      }

      try {
        const gmRaw = await rcon.send(`data get entity ${name} playerGameType`);
        const gmMatch = gmRaw.match(/has the following entity data:\s*(\d+)/i);
        if (gmMatch) {
          const typeCode = parseInt(gmMatch[1], 10);
          const modes = ["survival", "creative", "adventure", "spectator"];
          gamemode = modes[typeCode] || "survival";
        }
      } catch {
        gamemode = "survival";
      }

      try {
        const hpRaw = await rcon.send(`data get entity ${name} Health`);
        const hpMatch = hpRaw.match(/has the following entity data:\s*([\d.]+)f/i);
        if (hpMatch) health = Math.round(parseFloat(hpMatch[1]));
      } catch {
        health = 20;
      }

      try {
        const xpRaw = await rcon.send(`data get entity ${name} XpLevel`);
        const xpMatch = xpRaw.match(/has the following entity data:\s*(\d+)/i);
        if (xpMatch) xp = parseInt(xpMatch[1], 10);
      } catch {
        xp = 0;
      }

      return {
        name,
        ping: ping ?? 35,
        gamemode,
        health,
        xp,
        op: opNames.has(name.toLowerCase()),
      };
    });

    res.json({
      online: list.length,
      max: maxPlayers,
      list,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch online players" });
  }
});

/**
 * POST /api/players/kick
 */
router.post("/kick", async (req, res) => {
  try {
    const { name, reason } = req.body || {};
    if (!name) return res.status(400).json({ error: "Player name is required" });

    const cmd = reason ? `kick ${name} ${reason}` : `kick ${name}`;
    await rcon.send(cmd);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to kick player" });
  }
});

/**
 * POST /api/players/ban
 */
router.post("/ban", async (req, res) => {
  try {
    const { name, reason } = req.body || {};
    if (!name) return res.status(400).json({ error: "Player name is required" });

    const cmd = reason ? `ban ${name} ${reason}` : `ban ${name}`;
    await rcon.send(cmd);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to ban player" });
  }
});

/**
 * POST /api/players/unban
 */
router.post("/unban", async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "Player name is required" });

    await rcon.send(`pardon ${name}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to unban player" });
  }
});

/**
 * POST /api/players/op
 */
router.post("/op", async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "Player name is required" });

    await rcon.send(`op ${name}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to op player" });
  }
});

/**
 * POST /api/players/deop
 */
router.post("/deop", async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "Player name is required" });

    await rcon.send(`deop ${name}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to deop player" });
  }
});

/**
 * GET /api/players/whitelist
 */
router.get("/whitelist", async (req, res) => {
  try {
    const props = await properties.readProperties();
    const enabled = props["white-list"] === "true";
    const rawList = await readMcJson("whitelist.json");

    const players = rawList.map((p) => ({
      name: p.name,
      uuid: p.uuid,
      addedAt: p.createdOn || new Date().toISOString(),
    }));

    res.json({ enabled, players });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch whitelist" });
  }
});

/**
 * POST /api/players/whitelist
 */
router.post("/whitelist", async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "Player name is required" });

    await rcon.send(`whitelist add ${name}`);
    const rawList = await readMcJson("whitelist.json");
    const entry = rawList.find((p) => p.name?.toLowerCase() === name.toLowerCase()) || {
      name,
      uuid: null,
      addedAt: new Date().toISOString(),
    };

    res.json({ ok: true, player: entry });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to add player to whitelist" });
  }
});

/**
 * DELETE /api/players/whitelist/:name
 */
router.delete("/whitelist/:name", async (req, res) => {
  try {
    const { name } = req.params;
    await rcon.send(`whitelist remove ${name}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to remove player from whitelist" });
  }
});

/**
 * POST /api/players/whitelist/toggle
 */
router.post("/whitelist/toggle", async (req, res) => {
  try {
    const { enabled } = req.body || {};
    const boolVal = Boolean(enabled);

    await properties.setProperty("white-list", boolVal ? "true" : "false");
    try {
      await rcon.send(boolVal ? "whitelist on" : "whitelist off");
    } catch {
      // ignore if server is not yet up
    }

    res.json({ ok: true, enabled: boolVal });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to toggle whitelist" });
  }
});

/**
 * GET /api/players/ops
 */
router.get("/ops", async (req, res) => {
  try {
    const rawList = await readMcJson("ops.json");
    const ops = rawList.map((o) => ({
      name: o.name,
      level: o.level ?? 4,
      uuid: o.uuid,
      since: o.createdOn || null,
    }));
    res.json(ops);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch operator list" });
  }
});

/**
 * GET /api/players/bans
 */
router.get("/bans", async (req, res) => {
  try {
    const bannedJson = await readMcJson("banned-players.json");
    const bans = bannedJson.map((b) => ({
      name: b.name,
      reason: b.reason || "Banned by administrator",
      by: b.source || "Console",
      at: b.created || new Date().toISOString(),
    }));
    res.json(bans);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch banned players" });
  }
});

/**
 * POST /api/players/action
 * Triggers interactive actions on online players: heal, feed, teleport.
 */
router.post("/action", async (req, res) => {
  try {
    const { name, action, args } = req.body || {};
    if (!name || !action) {
      return res.status(400).json({ error: "Player name and action are required" });
    }

    if (action === "heal") {
      await rcon.send(`effect give ${name} minecraft:instant_health 1 10`);
    } else if (action === "feed") {
      await rcon.send(`effect give ${name} minecraft:saturation 1 10`);
    } else if (action === "teleport") {
      if (args && args.x !== undefined && args.y !== undefined && args.z !== undefined) {
        await rcon.send(`tp ${name} ${args.x} ${args.y} ${args.z}`);
      } else {
        await rcon.send(`tp ${name} 0 64 0`);
      }
    } else {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || `Failed to execute action ${req.body?.action}` });
  }
});

export default router;
