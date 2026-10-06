import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { CONFIG } from "../utils/config.js";
import { logger as log } from "../utils/logger.js";
import * as playitAgent from "../playit/agent.js";

const PLUGINS_DIR = path.join(CONFIG.mc.dir, "plugins");
const GEYSER_JAR = path.join(PLUGINS_DIR, "Geyser-Spigot.jar");
const FLOODGATE_JAR = path.join(PLUGINS_DIR, "floodgate.jar");
const GEYSER_CONFIG = path.join(PLUGINS_DIR, "Geyser-Spigot", "config.yml");

export async function getGeyserStatus() {
  const installed = fs.existsSync(GEYSER_JAR);
  const floodgateInstalled = fs.existsSync(FLOODGATE_JAR);
  let bedrockPort = 19132;
  let authType = "floodgate";

  if (installed && fs.existsSync(GEYSER_CONFIG)) {
    try {
      const content = fs.readFileSync(GEYSER_CONFIG, "utf8");
      // Simple regex parser for YAML config.yml
      const portMatch = content.match(/port:\s*([0-9]+)/);
      if (portMatch) bedrockPort = Number(portMatch[1]);

      const authMatch = content.match(/auth-type:\s*([a-zA-Z0-9_-]+)/);
      if (authMatch) authType = authMatch[1];
    } catch (err) {
      log.warn("Failed to parse Geyser config.yml:", err.message);
    }
  }

  const bedrockAddress = await getBedrockAddress(bedrockPort);

  return {
    installed,
    enabled: installed,
    bedrockPort,
    floodgateInstalled,
    authType,
    bedrockAddress,
  };
}

export async function installGeyser() {
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
  }

  const geyserUrl = "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot";
  const floodgateUrl = "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot";

  log.info("Downloading Geyser-Spigot.jar...");
  const geyserRes = await fetch(geyserUrl);
  if (!geyserRes.ok) throw new Error(`Failed to download Geyser: HTTP ${geyserRes.status}`);
  const geyserBuffer = await geyserRes.buffer();
  fs.writeFileSync(GEYSER_JAR, geyserBuffer);

  log.info("Downloading floodgate.jar...");
  const floodRes = await fetch(floodgateUrl);
  if (!floodRes.ok) throw new Error(`Failed to download Floodgate: HTTP ${floodRes.status}`);
  const floodBuffer = await floodRes.buffer();
  fs.writeFileSync(FLOODGATE_JAR, floodBuffer);

  log.info("Geyser and Floodgate installed successfully.");
  return { ok: true, restartRequired: true };
}

export async function uninstallGeyser() {
  if (fs.existsSync(GEYSER_JAR)) fs.unlinkSync(GEYSER_JAR);
  if (fs.existsSync(FLOODGATE_JAR)) fs.unlinkSync(FLOODGATE_JAR);
  log.info("Geyser and Floodgate uninstalled.");
  return { ok: true, restartRequired: true };
}

export async function updateGeyserConfig(partial) {
  if (!fs.existsSync(GEYSER_CONFIG)) {
    throw new Error("Geyser config.yml not found. Start server once after installing Geyser to generate config.");
  }

  let content = fs.readFileSync(GEYSER_CONFIG, "utf8");

  if (partial.bedrockPort !== undefined) {
    const newPort = Number(partial.bedrockPort);
    content = content.replace(/port:\s*[0-9]+/, `port: ${newPort}`);
  }

  if (partial.authType !== undefined) {
    content = content.replace(/auth-type:\s*[a-zA-Z0-9_-]+/, `auth-type: ${partial.authType}`);
  }

  fs.writeFileSync(GEYSER_CONFIG, content, "utf8");
  log.info("Updated Geyser config.yml");
  return { ok: true, restartRequired: true };
}

export async function getBedrockAddress(port = 19132) {
  try {
    const tunnel = await playitAgent.getTunnelStatus();
    if (tunnel && tunnel.address) {
      // Replace port in address or append port if needed
      const host = tunnel.address.split(":")[0];
      return `${host}:${port}`;
    }
  } catch {
    // ignore
  }
  return null;
}
