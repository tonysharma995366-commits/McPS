import { Rcon } from "rcon-client";
import { CONFIG } from "./config.js";
import { log } from "./logger.js";

/**
 * Persistent RCON client manager with auto-reconnect and concurrency mutex.
 */
let client = null;
let connectPromise = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 12;
const RECONNECT_INTERVAL_MS = 5000;

function setupEventHandlers(rconInstance) {
  rconInstance.on("end", () => {
    log.debug("RCON connection ended");
    client = null;
    scheduleReconnect();
  });

  rconInstance.on("error", (err) => {
    log.debug(`RCON client error: ${err.message}`);
    client = null;
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimer || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }

  reconnectAttempts++;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    log.debug(`Attempting RCON auto-reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    try {
      const conn = await connect();
      if (conn) {
        reconnectAttempts = 0;
      } else {
        scheduleReconnect();
      }
    } catch {
      scheduleReconnect();
    }
  }, RECONNECT_INTERVAL_MS);
}

/**
 * Connects to the Minecraft RCON server if not already connected.
 * Safe for concurrent invocations.
 *
 * @returns {Promise<Rcon | null>}
 */
export async function connect() {
  if (client && client.authenticated) {
    return client;
  }

  // Promise-based mutex: reuse in-flight connection promise
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      const rcon = new Rcon({
        host: CONFIG.rcon.host,
        port: CONFIG.rcon.port,
        password: CONFIG.rcon.password,
        timeout: 5000,
      });

      setupEventHandlers(rcon);
      await rcon.connect();

      client = rcon;
      reconnectAttempts = 0;
      log.info(`RCON connected to ${CONFIG.rcon.host}:${CONFIG.rcon.port}`);
      return client;
    } catch (err) {
      client = null;
      log.warn(`RCON connection failed (${CONFIG.rcon.host}:${CONFIG.rcon.port}): ${err.message}`);
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/**
 * Sends a command to the Minecraft server via RCON.
 * Retries connection once if disconnected.
 *
 * @param {string} command - Minecraft console command (without leading slash)
 * @returns {Promise<string>} Output response from Minecraft server
 */
export async function send(command) {
  let activeClient = client;

  if (!activeClient || !activeClient.authenticated) {
    activeClient = await connect();
  }

  if (!activeClient) {
    throw new Error("RCON not connected");
  }

  try {
    const rawResponse = await activeClient.send(command);
    return typeof rawResponse === "string" ? rawResponse.trimEnd() : "";
  } catch (err) {
    log.debug(`RCON send error ("${command}"), attempting reconnect retry: ${err.message}`);
    client = null;
    activeClient = await connect();
    if (!activeClient) {
      throw new Error(`RCON command failed: ${err.message}`);
    }
    const rawResponse = await activeClient.send(command);
    return typeof rawResponse === "string" ? rawResponse.trimEnd() : "";
  }
}

/**
 * Checks if RCON client is currently active and authenticated.
 *
 * @returns {boolean}
 */
export function isConnected() {
  return Boolean(client && client.authenticated);
}

/**
 * Gracefully disconnects the RCON client.
 */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;
  if (client) {
    try {
      client.end();
    } catch {
      // ignore
    }
    client = null;
  }
}
