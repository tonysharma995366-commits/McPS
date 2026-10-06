import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-Memory Server State
let serverState = {
  status: 'stopped', // 'running' | 'stopped' | 'starting'
  uptime: 0, // seconds
  players: 0,
  maxPlayers: 20,
  tps: 0,
  ram: { used: 1.2, total: 4.0 },
  cpu: 12,
  disk: { used: 12.4, total: 40.0 },
  address: null as string | null,
  world: {
    name: 'world',
    size: '0 MB',
    lastBackup: null as string | null,
  },
  performanceMode: false,
};

let playitState: {
  claimed: boolean;
  claimUrl: string | null;
  address: string | null;
  region: string | null;
  latency: number | null;
  uptime: string | null;
  error: string | null;
} = {
  claimed: false,
  claimUrl: 'https://playit.gg/claim/railway-mc-tunnel-start77',
  address: null,
  region: null,
  latency: null,
  uptime: null,
  error: null,
};

let paperBuildVersion = 497;

interface LogItem {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  isChat?: boolean;
}

let logCounter = 1;
const createLog = (level: string, message: string, isChat = false, timestamp?: string): LogItem => ({
  id: `log-${Date.now()}-${logCounter++}`,
  level,
  message,
  timestamp: timestamp || new Date().toISOString(),
  isChat,
});

let logs: LogItem[] = [];

// Connected WebSocket clients
const wsClients = new Set<WebSocket>();

function broadcastLog(logItem: LogItem) {
  logs.push(logItem);
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  const payload = JSON.stringify(logItem);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {
        // ignore send error
      }
    }
  }
}

// API Endpoints
app.get('/api/status', (req, res) => {
  res.json(serverState);
});

app.get('/api/playit', (req, res) => {
  res.json(playitState);
});

app.post('/api/playit/claim', (req, res) => {
  playitState.claimed = true;
  playitState.claimUrl = null;
  playitState.address = 'mc-railway-node.playit.gg:25565';
  playitState.region = 'India (Mumbai)';
  playitState.latency = 42;
  playitState.uptime = '6h 12m';
  playitState.error = null;
  broadcastLog(createLog('INFO', '[Playit]: Tunnel claimed successfully. Public address: mc-railway-node.playit.gg:25565'));
  res.json({ success: true, ...playitState });
});

app.post('/api/playit/reconnect', (req, res) => {
  playitState.error = null;
  broadcastLog(createLog('INFO', '[Playit]: Reconnecting tunnel to edge gateway...'));
  setTimeout(() => {
    if (playitState.address) {
      broadcastLog(createLog('INFO', `[Playit]: Tunnel re-established on ${playitState.address}`));
    }
  }, 1000);
  res.json({ success: true, ...playitState });
});

app.post('/api/playit/retry', (req, res) => {
  playitState.error = null;
  broadcastLog(createLog('INFO', '[Playit]: Retrying connection to tunnel gateway...'));
  res.json({ success: true, ...playitState });
});

app.post('/api/playit/regenerate', (req, res) => {
  playitState.claimed = false;
  playitState.address = null;
  playitState.region = null;
  playitState.latency = null;
  playitState.uptime = null;
  playitState.error = null;
  const newSecret = Math.random().toString(36).substring(2, 8);
  playitState.claimUrl = `https://playit.gg/claim/railway-mc-tunnel-${newSecret}`;
  broadcastLog(createLog('INFO', '[Playit]: Regenerated new tunnel claim link'));
  res.json({ success: true, ...playitState });
});

app.post('/api/server/start', (req, res) => {
  serverState.status = 'starting';
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Initializing server container...'));
  
  setTimeout(() => {
    serverState.status = 'running';
    serverState.players = 1;
    serverState.cpu = 28;
    serverState.tps = 20.0;
    broadcastLog(createLog('INFO', '[Server thread/INFO]: Server started on port 25565'));
  }, 2500);

  res.json({ success: true, status: 'starting' });
});

app.post('/api/server/stop', (req, res) => {
  serverState.status = 'stopped';
  serverState.players = 0;
  serverState.cpu = 3;
  serverState.tps = 0;
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Stopping server. Saving chunks...'));
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Server stopped cleanly.'));
  res.json({ success: true, status: 'stopped' });
});

app.post('/api/server/restart', (req, res) => {
  serverState.status = 'starting';
  serverState.players = 0;
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Server restart initiated by admin.'));

  setTimeout(() => {
    serverState.status = 'running';
    serverState.players = 2;
    serverState.cpu = 24;
    serverState.tps = 19.9;
    serverState.uptime = 0;
    broadcastLog(createLog('INFO', '[Server thread/INFO]: Done! Server rebooted successfully.'));
  }, 3000);

  res.json({ success: true, status: 'starting' });
});

app.post('/api/server/backup', (req, res) => {
  serverState.world.lastBackup = new Date().toISOString();
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Created world snapshot backup (${serverState.world.size})`));
  res.json({ success: true, lastBackup: serverState.world.lastBackup });
});

app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 200;
  const since = req.query.since as string;

  if (since) {
    const sinceTime = new Date(since).getTime();
    const filtered = isNaN(sinceTime)
      ? logs.slice(-20)
      : logs.filter((l) => new Date(l.timestamp).getTime() > sinceTime);
    return res.json(filtered);
  }

  res.json(logs.slice(-limit));
});

// POST /api/console
app.post('/api/console', (req, res) => {
  let { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ ok: false, error: 'Command is required' });
  }

  command = command.trim();
  if (!command.startsWith('/')) {
    command = '/' + command;
  }

  // Broadcast executed command
  broadcastLog(createLog('INFO', `[Server thread/INFO]: [Admin] ${command}`));

  // Generate realistic response based on command
  setTimeout(() => {
    const lower = command.toLowerCase();
    if (lower.startsWith('/say ')) {
      const msg = command.substring(5).trim();
      broadcastLog(createLog('INFO', `[Server] ${msg}`, true));
    } else if (lower === '/save-all') {
      broadcastLog(createLog('INFO', '[Server thread/INFO]: Saving the game (all players, dimensions and chunks)'));
      broadcastLog(createLog('INFO', '[Server thread/INFO]: Saved the game'));
    } else if (lower.startsWith('/op ')) {
      const target = command.substring(4).trim();
      broadcastLog(createLog('INFO', `[Server thread/INFO]: Made [${target}] a server operator`));
    } else if (lower.startsWith('/kick ')) {
      const target = command.substring(6).trim();
      broadcastLog(createLog('INFO', `[Server thread/INFO]: Kicked ${target}: Kicked by an operator`));
      if (serverState.players > 0) {
        serverState.players--;
      }
    } else if (lower.startsWith('/reload')) {
      broadcastLog(createLog('INFO', '[Server thread/INFO]: Reloading ResourceManager: Default, bukkit...'));
      broadcastLog(createLog('INFO', '[Server thread/INFO]: Reload complete.'));
    } else if (lower === '/list') {
      broadcastLog(createLog('INFO', `[Server thread/INFO]: There are ${serverState.players} of a max of ${serverState.maxPlayers} players online: Steve, Alex`));
    } else {
      broadcastLog(createLog('INFO', `[Server thread/INFO]: Command [${command}] executed successfully.`));
    }
  }, 100);

  res.json({ ok: true });
});

app.post('/api/performance', (req, res) => {
  const { enabled } = req.body;
  serverState.performanceMode = Boolean(enabled);
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Performance mode set to ${serverState.performanceMode ? 'ENABLED' : 'DISABLED'}`));
  res.json({ success: true, performanceMode: serverState.performanceMode });
});

app.post('/api/copy', (req, res) => {
  res.json({ success: true });
});

// Players State & Endpoints
let onlinePlayers: any[] = [];

let whitelistData = {
  enabled: false,
  players: [] as any[],
};

let operatorsData: any[] = [];

let bannedPlayersData: any[] = [];

// GET /api/players/online
app.get('/api/players/online', (req, res) => {
  serverState.players = onlinePlayers.length;
  res.json(onlinePlayers);
});

// GET /api/players/whitelist
app.get('/api/players/whitelist', (req, res) => {
  res.json(whitelistData);
});

// POST /api/players/whitelist/toggle { enabled }
app.post('/api/players/whitelist/toggle', (req, res) => {
  const { enabled } = req.body;
  whitelistData.enabled = Boolean(enabled);
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Whitelist is now ${whitelistData.enabled ? 'ON' : 'OFF'}`));
  res.json({ success: true, enabled: whitelistData.enabled });
});

// POST /api/players/whitelist { name }
app.post('/api/players/whitelist', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Player name is required' });
  const cleanName = name.trim();
  if (!whitelistData.players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
    whitelistData.players.push({ name: cleanName, addedAt: 'Just now' });
    broadcastLog(createLog('INFO', `[Server thread/INFO]: Added ${cleanName} to whitelist`));
  }
  res.json({ success: true, players: whitelistData.players });
});

// DELETE /api/players/whitelist/:name
app.delete('/api/players/whitelist/:name', (req, res) => {
  const { name } = req.params;
  whitelistData.players = whitelistData.players.filter(
    (p) => p.name.toLowerCase() !== name.toLowerCase()
  );
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Removed ${name} from whitelist`));
  res.json({ success: true, players: whitelistData.players });
});

// GET /api/players/ops
app.get('/api/players/ops', (req, res) => {
  res.json(operatorsData);
});

// POST /api/players/op { name, level }
app.post('/api/players/op', (req, res) => {
  const { name, level = 4 } = req.body;
  if (!name) return res.status(400).json({ error: 'Player name is required' });
  const cleanName = name.trim();

  if (Number(level) === 0) {
    operatorsData = operatorsData.filter(
      (op) => op.name.toLowerCase() !== cleanName.toLowerCase()
    );
    const p = onlinePlayers.find((x) => x.name.toLowerCase() === cleanName.toLowerCase());
    if (p) p.op = false;
    broadcastLog(createLog('INFO', `[Server thread/INFO]: De-opped player ${cleanName}`));
  } else {
    const existing = operatorsData.find((x) => x.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      existing.level = level;
    } else {
      operatorsData.push({ name: cleanName, level: Number(level) || 4, since: 'Just now' });
    }
    const p = onlinePlayers.find((x) => x.name.toLowerCase() === cleanName.toLowerCase());
    if (p) p.op = true;
    broadcastLog(createLog('INFO', `[Server thread/INFO]: Made ${cleanName} a server operator (level ${level})`));
  }

  res.json({ success: true, operators: operatorsData });
});

// GET /api/players/bans
app.get('/api/players/bans', (req, res) => {
  res.json(bannedPlayersData);
});

// POST /api/players/ban { name, reason }
app.post('/api/players/ban', (req, res) => {
  const { name, reason = 'Banned by operator' } = req.body;
  if (!name) return res.status(400).json({ error: 'Player name is required' });
  const cleanName = name.trim();

  if (!bannedPlayersData.some((b) => b.name.toLowerCase() === cleanName.toLowerCase())) {
    bannedPlayersData.push({
      name: cleanName,
      reason,
      by: 'Admin',
      at: 'Just now',
    });
  }

  // Remove from online players if currently online
  onlinePlayers = onlinePlayers.filter(
    (p) => p.name.toLowerCase() !== cleanName.toLowerCase()
  );
  serverState.players = onlinePlayers.length;

  broadcastLog(createLog('INFO', `[Server thread/INFO]: Banned player ${cleanName}: ${reason}`));
  res.json({ success: true, bans: bannedPlayersData });
});

// POST /api/players/unban { name }
app.post('/api/players/unban', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Player name is required' });
  const cleanName = name.trim();

  bannedPlayersData = bannedPlayersData.filter(
    (b) => b.name.toLowerCase() !== cleanName.toLowerCase()
  );
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Unbanned player ${cleanName}`));
  res.json({ success: true, bans: bannedPlayersData });
});

// POST /api/players/kick { name, reason? }
app.post('/api/players/kick', (req, res) => {
  const { name, reason = 'Kicked by operator' } = req.body;
  if (!name) return res.status(400).json({ error: 'Player name is required' });
  const cleanName = name.trim();

  onlinePlayers = onlinePlayers.filter(
    (p) => p.name.toLowerCase() !== cleanName.toLowerCase()
  );
  serverState.players = onlinePlayers.length;

  broadcastLog(createLog('INFO', `[Server thread/INFO]: Kicked ${cleanName}: ${reason}`));
  res.json({ success: true });
});

// POST /api/players/action { name, action, args? }
app.post('/api/players/action', (req, res) => {
  const { name, action, args } = req.body;
  if (!name || !action) return res.status(400).json({ error: 'Missing name or action' });
  const player = onlinePlayers.find((p) => p.name.toLowerCase() === name.toLowerCase());

  if (action === 'teleport') {
    if (player) {
      player.pos = { x: 0, y: 64, z: 0 };
      player.dimension = 'Overworld';
    }
    broadcastLog(createLog('INFO', `[Server thread/INFO]: Teleported ${name} to spawn [0, 64, 0]`));
  } else if (action === 'heal') {
    if (player) {
      player.health = 20;
    }
    broadcastLog(createLog('INFO', `[Server thread/INFO]: Healed ${name} to max health`));
  } else if (action === 'feed') {
    broadcastLog(createLog('INFO', `[Server thread/INFO]: Restored hunger for ${name}`));
  }

  res.json({ success: true, player });
});

// Plugins In-Memory State & Endpoints
interface PluginItem {
  id: string;
  name: string;
  version: string;
  size: string;
  enabled: boolean;
  author: string;
  description: string;
  commands: string[];
  permissions: string[];
  dependencies: string[];
  apiVersion: string;
  loadOrder: string;
  installedAt: string;
  updatedAt: string;
  updateAvailable: boolean;
  updateVersion?: string;
  needsRestart?: boolean;
  error?: boolean;
}

let installedPlugins: PluginItem[] = [];

// GET /api/plugins
app.get('/api/plugins', (req, res) => {
  res.json(installedPlugins);
});

// GET /api/plugins/updates
app.get('/api/plugins/updates', (req, res) => {
  const updates = installedPlugins.filter((p) => p.updateAvailable);
  res.json(updates);
});

// POST /api/plugins/upload (multipart or simple mock handler)
app.post('/api/plugins/upload', (req, res) => {
  const newPlugin = {
    id: `custom-plugin-${Date.now()}`,
    name: 'CustomPlugin.jar',
    version: 'v1.0.0',
    size: '1.2 MB',
    enabled: true,
    author: 'Custom',
    description: 'Custom uploaded Minecraft plugin jar file.',
    commands: ['/custom'],
    permissions: [],
    dependencies: [],
    apiVersion: '1.20',
    loadOrder: 'NORMAL',
    installedAt: 'Just now',
    updatedAt: 'Just now',
    updateAvailable: false,
    needsRestart: true,
  };
  installedPlugins.unshift(newPlugin);
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Uploaded and registered plugin ${newPlugin.name}`));
  res.json({ success: true, plugin: newPlugin });
});

// POST /api/plugins/install-url { url, name? }
app.post('/api/plugins/install-url', (req, res) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  let derivedName = name || 'PluginFromUrl';
  try {
    const urlObj = new URL(url);
    const pathnameParts = urlObj.pathname.split('/');
    const lastPart = pathnameParts[pathnameParts.length - 1];
    if (lastPart && lastPart.endsWith('.jar')) {
      derivedName = lastPart.replace('.jar', '');
    }
  } catch {
    // ignore parse error
  }

  const newPlugin = {
    id: `plugin-${Date.now()}`,
    name: derivedName,
    version: 'v1.0.0',
    size: '2.5 MB',
    enabled: true,
    author: 'Remote URL',
    description: `Installed directly from ${url}`,
    commands: [],
    permissions: [],
    dependencies: [],
    apiVersion: '1.20',
    loadOrder: 'NORMAL',
    installedAt: 'Just now',
    updatedAt: 'Just now',
    updateAvailable: false,
    needsRestart: true,
  };
  installedPlugins.unshift(newPlugin);
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Downloaded and loaded ${newPlugin.name} from remote URL`));
  res.json({ success: true, plugin: newPlugin });
});

// POST /api/plugins/install-store { id }
app.post('/api/plugins/install-store', (req, res) => {
  const { id } = req.body;
  const existing = installedPlugins.find((p) => p.id === id);
  if (existing) {
    return res.json({ success: true, alreadyInstalled: true, plugin: existing });
  }

  const newPlugin = {
    id: id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    version: 'v1.0.0',
    size: '3.0 MB',
    enabled: true,
    author: 'Curated Store',
    description: `Installed from plugin repository.`,
    commands: [`/${id}`],
    permissions: [],
    dependencies: [],
    apiVersion: '1.20',
    loadOrder: 'NORMAL',
    installedAt: 'Just now',
    updatedAt: 'Just now',
    updateAvailable: false,
    needsRestart: true,
  };
  installedPlugins.unshift(newPlugin);
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Installed plugin ${newPlugin.name} from Store`));
  res.json({ success: true, plugin: newPlugin });
});

// POST /api/plugins/:id/toggle { enabled }
app.post('/api/plugins/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  const plugin = installedPlugins.find((p) => p.id === id);
  if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

  plugin.enabled = Boolean(enabled);
  plugin.needsRestart = true;
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Plugin ${plugin.name} is now ${plugin.enabled ? 'ENABLED' : 'DISABLED'}`));
  res.json({ success: true, plugin });
});

// POST /api/plugins/:id/reload
app.post('/api/plugins/:id/reload', (req, res) => {
  const { id } = req.params;
  const plugin = installedPlugins.find((p) => p.id === id);
  if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

  broadcastLog(createLog('INFO', `[Server thread/INFO]: Reloaded configuration for ${plugin.name}`));
  res.json({ success: true, message: `Reloaded ${plugin.name}` });
});

// POST /api/plugins/:id/update
app.post('/api/plugins/:id/update', (req, res) => {
  const { id } = req.params;
  const plugin = installedPlugins.find((p) => p.id === id);
  if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

  if (plugin.updateVersion) {
    plugin.version = plugin.updateVersion;
  }
  plugin.updateAvailable = false;
  plugin.updatedAt = 'Just now';
  plugin.needsRestart = true;
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Updated ${plugin.name} to ${plugin.version}`));
  res.json({ success: true, plugin });
});

// POST /api/plugins/:id/reset-config
app.post('/api/plugins/:id/reset-config', (req, res) => {
  const { id } = req.params;
  const plugin = installedPlugins.find((p) => p.id === id);
  if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

  broadcastLog(createLog('INFO', `[Server thread/INFO]: Reset configuration to defaults for ${plugin.name}`));
  res.json({ success: true, message: `Config reset for ${plugin.name}` });
});

// DELETE /api/plugins/:id
app.delete('/api/plugins/:id', (req, res) => {
  const { id } = req.params;
  const index = installedPlugins.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Plugin not found' });

  const removed = installedPlugins.splice(index, 1)[0];
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Uninstalled and removed plugin ${removed.name}`));
  res.json({ success: true, removed });
});

// POST /api/plugins/reload-all
app.post('/api/plugins/reload-all', (req, res) => {
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Reloading all plugins and configurations...'));
  setTimeout(() => {
    broadcastLog(createLog('INFO', '[Server thread/INFO]: All plugins reloaded successfully.'));
  }, 1000);
  res.json({ success: true, message: 'All plugins reloaded' });
});

// World & Settings State
let worldData = {
  name: 'world',
  type: 'Survival',
  difficulty: 'Normal',
  size: '248 MB',
  seed: '-78218941928475245',
  lastBackup: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  uptime: '6h 12m',
};

let gameRulesData: Record<string, boolean> = {
  keepInventory: false,
  mobGriefing: true,
  doDaylightCycle: true,
  doWeatherCycle: true,
  fallDamage: true,
  doFireTick: true,
  naturalRegeneration: true,
};

// Full raw server.properties state (all ~60 Minecraft keys)
const DEFAULT_RAW_PROPERTIES: Record<string, string> = {
  'server-port': '25565',
  'server-ip': '',
  'enable-query': 'false',
  'query.port': '25565',
  'enable-rcon': 'false',
  'rcon.port': '25575',
  'rcon.password': '',
  'network-compression-threshold': '256',
  'prevent-proxy-connections': 'false',
  'online-mode': 'true',
  'enforce-secure-profile': 'true',

  'gamemode': 'survival',
  'force-gamemode': 'false',
  'difficulty': 'normal',
  'hardcore': 'false',
  'pvp': 'true',
  'allow-flight': 'false',
  'allow-nether': 'true',
  'allow-end': 'true',
  'spawn-monsters': 'true',
  'spawn-animals': 'true',
  'spawn-npcs': 'true',
  'generate-structures': 'true',
  'max-world-size': '29999984',
  'player-idle-timeout': '0',
  'max-players': '20',

  'level-name': 'world',
  'level-seed': '-78218941928475245',
  'level-type': 'minecraft:normal',
  'generator-settings': '{}',
  'spawn-protection': '16',
  'view-distance': '8',
  'simulation-distance': '6',
  'max-tick-time': '60000',
  'sync-chunk-writes': 'true',
  'entity-broadcast-range-percentage': '100',
  'max-entity-crush': '24',
  'enable-command-block': 'false',

  'motd': 'A Minecraft Server Powered by Railway',
  'enable-status': 'true',
  'broadcast-console-to-ops': 'true',
  'broadcast-rcon-to-ops': 'true',
  'hide-online-players': 'false',
  'op-permission-level': '4',
  'function-permission-level': '2',
  'white-list': 'true',
  'enforce-whitelist': 'false',
  'log-ips': 'true',

  'use-native-transport': 'true',
  'rate-limit': '0',

  'text-filtering-config': '',
  'resource-pack': '',
  'resource-pack-sha1': '',
  'resource-pack-prompt': '',
  'require-resource-pack': 'false',
  'initial-enabled-packs': 'vanilla',
  'initial-disabled-packs': '',
  'bug-report-link': '',
  'enable-jmx-monitoring': 'false',
  'enable-code-of-conduct': 'false',
};

let currentRawProperties: Record<string, string> = { ...DEFAULT_RAW_PROPERTIES };

function serializeProperties(props: Record<string, string>): string {
  const header = `# Minecraft server properties\n# Generated by MC RailAdmin\n# ${new Date().toISOString()}\n`;
  const body = Object.entries(props)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  return `${header}${body}\n`;
}

let serverPropertiesData = {
  motd: currentRawProperties['motd'],
  serverPort: Number(currentRawProperties['server-port']) || 25565,
  maxPlayers: Number(currentRawProperties['max-players']) || 20,
  viewDistance: Number(currentRawProperties['view-distance']) || 8,
  simulationDistance: Number(currentRawProperties['simulation-distance']) || 6,
  onlineMode: currentRawProperties['online-mode'] === 'true',
  whiteList: currentRawProperties['white-list'] === 'true',
  pvp: currentRawProperties['pvp'] === 'true',
  spawnProtection: Number(currentRawProperties['spawn-protection']) || 16,
  difficulty: currentRawProperties['difficulty'] || 'normal',
  gamemode: currentRawProperties['gamemode'] || 'survival',
  forceGamemode: currentRawProperties['force-gamemode'] === 'true',
  spawnMonsters: currentRawProperties['spawn-monsters'] === 'true',
  spawnAnimals: currentRawProperties['spawn-animals'] === 'true',
  spawnNpcs: currentRawProperties['spawn-npcs'] === 'true',
  allowFlight: currentRawProperties['allow-flight'] === 'true',
  allowNether: currentRawProperties['allow-nether'] === 'true',
  allowEnd: currentRawProperties['allow-end'] === 'true',
};

// GET /api/world
app.get('/api/world', (req, res) => {
  res.json(worldData);
});

// POST /api/world/backup
app.post('/api/world/backup', (req, res) => {
  worldData.lastBackup = new Date().toISOString();
  serverState.world.lastBackup = worldData.lastBackup;
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Snapshot backup created for ${worldData.name} (${worldData.size})`));
  res.json({ success: true, lastBackup: worldData.lastBackup });
});

// GET /api/world/download
app.get('/api/world/download', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="world-backup.zip"');
  res.setHeader('Content-Type', 'application/zip');
  res.send(Buffer.from('PK\x05\x06' + '\x00'.repeat(18))); // Empty mock zip
});

// POST /api/world/upload
app.post('/api/world/upload', (req, res) => {
  worldData.lastBackup = new Date().toISOString();
  worldData.size = '264 MB';
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Replaced world from uploaded archive. Loading new level...'));
  res.json({ success: true, world: worldData });
});

// POST /api/world/regenerate
app.post('/api/world/regenerate', (req, res) => {
  const { seed, backup } = req.body;
  if (backup) {
    worldData.lastBackup = new Date().toISOString();
  }
  worldData.seed = seed || String(Math.floor(Math.random() * 1e16));
  worldData.size = '180 MB';
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Regenerating world with seed [${worldData.seed}]...`));
  res.json({ success: true, world: worldData });
});

// DELETE /api/world
app.delete('/api/world', (req, res) => {
  broadcastLog(createLog('WARN', '[Server thread/WARN]: Deleted world files. Fresh generation will begin on restart.'));
  res.json({ success: true, message: 'World deleted' });
});

// GET /api/world/gamerules
app.get('/api/world/gamerules', (req, res) => {
  res.json(gameRulesData);
});

// POST /api/world/gamerule
app.post('/api/world/gamerule', (req, res) => {
  const { rule, value } = req.body;
  if (!rule) return res.status(400).json({ error: 'Rule name required' });
  gameRulesData[rule] = Boolean(value);
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Game rule ${rule} has been set to ${value}`));
  res.json({ success: true, rule, value: gameRulesData[rule] });
});

// GET /api/properties
app.get('/api/properties', (req, res) => {
  res.json({
    values: { ...currentRawProperties },
    defaults: { ...DEFAULT_RAW_PROPERTIES },
    rawText: serializeProperties(currentRawProperties),
    ...serverPropertiesData,
    properties: { ...currentRawProperties },
  });
});

// POST /api/properties
app.post('/api/properties', (req, res) => {
  const body = req.body || {};
  const updates: Record<string, any> = body.values ? body.values : body;

  const LIVE_KEYS = new Set([
    'difficulty',
    'gamemode',
    'pvp',
    'spawn-monsters',
    'spawn-animals',
    'spawn-npcs',
    'allow-flight',
    'allow-nether',
    'allow-end',
  ]);

  const liveApplied: string[] = [];
  const restartNeeded: string[] = [];

  for (const [key, val] of Object.entries(updates)) {
    let propKey = key;
    if (key === 'serverPort') propKey = 'server-port';
    else if (key === 'maxPlayers') propKey = 'max-players';
    else if (key === 'viewDistance') propKey = 'view-distance';
    else if (key === 'simulationDistance') propKey = 'simulation-distance';
    else if (key === 'onlineMode') propKey = 'online-mode';
    else if (key === 'whiteList') propKey = 'white-list';
    else if (key === 'forceGamemode') propKey = 'force-gamemode';
    else if (key === 'spawnProtection') propKey = 'spawn-protection';
    else if (key === 'spawnMonsters') propKey = 'spawn-monsters';
    else if (key === 'spawnAnimals') propKey = 'spawn-animals';
    else if (key === 'spawnNpcs') propKey = 'spawn-npcs';
    else if (key === 'allowFlight') propKey = 'allow-flight';
    else if (key === 'allowNether') propKey = 'allow-nether';
    else if (key === 'allowEnd') propKey = 'allow-end';

    const strVal = String(val);
    if (currentRawProperties[propKey] !== strVal) {
      currentRawProperties[propKey] = strVal;
      if (LIVE_KEYS.has(propKey)) {
        liveApplied.push(propKey);
      } else {
        restartNeeded.push(propKey);
      }
    }
  }

  // Sync legacy serverPropertiesData
  serverPropertiesData.motd = currentRawProperties['motd'] || serverPropertiesData.motd;
  serverPropertiesData.serverPort = Number(currentRawProperties['server-port']) || 25565;
  serverPropertiesData.maxPlayers = Number(currentRawProperties['max-players']) || 20;
  serverPropertiesData.viewDistance = Number(currentRawProperties['view-distance']) || 8;
  serverPropertiesData.simulationDistance = Number(currentRawProperties['simulation-distance']) || 6;
  serverPropertiesData.onlineMode = currentRawProperties['online-mode'] === 'true';
  serverPropertiesData.whiteList = currentRawProperties['white-list'] === 'true';
  serverPropertiesData.pvp = currentRawProperties['pvp'] === 'true';
  serverPropertiesData.spawnProtection = Number(currentRawProperties['spawn-protection']) || 16;
  serverPropertiesData.difficulty = currentRawProperties['difficulty'] || 'normal';
  serverPropertiesData.gamemode = currentRawProperties['gamemode'] || 'survival';

  if (liveApplied.length > 0) {
    broadcastLog(createLog('INFO', `[RCON]: Applied ${liveApplied.length} live game rules instantly: [${liveApplied.join(', ')}]`));
  }
  if (restartNeeded.length > 0) {
    broadcastLog(createLog('INFO', `[Server thread/INFO]: Saved ${restartNeeded.length} settings to server.properties (restart required to apply: ${restartNeeded.slice(0, 3).join(', ')}${restartNeeded.length > 3 ? '...' : ''})`));
  }

  res.json({
    success: true,
    values: { ...currentRawProperties },
    liveKeys: liveApplied,
    restartKeys: restartNeeded,
    rawText: serializeProperties(currentRawProperties),
    properties: { ...currentRawProperties },
    ...serverPropertiesData,
  });
});

// POST /api/properties/reset
app.post('/api/properties/reset', (req, res) => {
  const { keys } = req.body || {};
  if (Array.isArray(keys) && keys.length > 0) {
    for (const k of keys) {
      if (DEFAULT_RAW_PROPERTIES[k] !== undefined) {
        currentRawProperties[k] = DEFAULT_RAW_PROPERTIES[k];
      }
    }
    broadcastLog(createLog('INFO', `[Server thread/INFO]: Reset ${keys.length} server.properties keys to defaults`));
  } else {
    currentRawProperties = { ...DEFAULT_RAW_PROPERTIES };
    broadcastLog(createLog('INFO', '[Server thread/INFO]: Reset server.properties to factory defaults'));
  }

  // Sync legacy serverPropertiesData
  serverPropertiesData.motd = currentRawProperties['motd'];
  serverPropertiesData.serverPort = Number(currentRawProperties['server-port']) || 25565;
  serverPropertiesData.maxPlayers = Number(currentRawProperties['max-players']) || 20;
  serverPropertiesData.viewDistance = Number(currentRawProperties['view-distance']) || 8;
  serverPropertiesData.simulationDistance = Number(currentRawProperties['simulation-distance']) || 6;
  serverPropertiesData.onlineMode = currentRawProperties['online-mode'] === 'true';
  serverPropertiesData.whiteList = currentRawProperties['white-list'] === 'true';
  serverPropertiesData.pvp = currentRawProperties['pvp'] === 'true';

  res.json({
    success: true,
    values: { ...currentRawProperties },
    rawText: serializeProperties(currentRawProperties),
    properties: { ...currentRawProperties },
    ...serverPropertiesData,
  });
});

// POST /api/properties/raw
app.post('/api/properties/raw', (req, res) => {
  const { rawText } = req.body || {};
  if (typeof rawText !== 'string') {
    return res.status(400).json({ error: 'rawText must be a string' });
  }

  const lines = rawText.split('\n');
  const parsed: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key) {
        parsed[key] = val;
      }
    }
  }

  // Update currentRawProperties
  Object.assign(currentRawProperties, parsed);

  // Sync legacy serverPropertiesData
  serverPropertiesData.motd = currentRawProperties['motd'] || serverPropertiesData.motd;
  serverPropertiesData.serverPort = Number(currentRawProperties['server-port']) || 25565;
  serverPropertiesData.maxPlayers = Number(currentRawProperties['max-players']) || 20;

  broadcastLog(createLog('INFO', `[Server thread/INFO]: Written raw server.properties (${Object.keys(parsed).length} keys)`));

  res.json({
    success: true,
    values: { ...currentRawProperties },
    rawText: serializeProperties(currentRawProperties),
    properties: { ...currentRawProperties },
    ...serverPropertiesData,
  });
});

// POST /api/system/wipe
app.post('/api/system/wipe', (req, res) => {
  broadcastLog(createLog('ERROR', '[Server thread/ERROR]: FULL SYSTEM WIPE initiated. Deleting world, plugins, and configs.'));
  installedPlugins = [];
  onlinePlayers = [];
  res.json({ success: true, message: 'System wiped cleanly' });
});

// GET /api/system/checks
app.get('/api/system/checks', (req, res) => {
  const mem = process.memoryUsage();
  const heapUsedMb = Number((mem.heapUsed / (1024 * 1024)).toFixed(1));
  const heapTotalMb = Number((mem.heapTotal / (1024 * 1024)).toFixed(1));
  const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  res.json({
    mc: {
      processRunning: serverState.status === 'running',
      jarPresent: true,
      eulaAccepted: true,
      propertiesValid: Object.keys(currentRawProperties).length > 0,
      worldExists: true,
      portBound: true,
      paperVersion: `Paper 1.20.4 (build ${paperBuildVersion})`,
      expectedVersion: '1.20.4',
    },
    rcon: {
      connected: true,
      passwordSet: true,
      passwordIsDefault: false,
      latencyMs: 14,
    },
    filesystem: {
      mcDirWritable: true,
      backupDirWritable: true,
      pluginsDirExists: true,
      logReadable: true,
    },
    env: {
      nodeVersion: process.version,
      javaVersion: '17.0.9 (Eclipse Adoptium)',
      port: PORT,
      rconPasswordSet: true,
      mcRamMax: '1536M',
      playitSecretSet: true,
      apiKeySet: false,
    },
    heap: {
      usedMb: heapUsedMb,
      totalMb: heapTotalMb,
      percent: heapPercent,
    },
  });
});

// GET /api/system/diagnostics
app.get('/api/system/diagnostics', (req, res) => {
  res.json({
    java: '17.0.9 (Eclipse Adoptium)',
    mcVersion: '1.20.4',
    paperBuild: String(paperBuildVersion),
    pluginsLoaded: `${installedPlugins.filter((p) => p.enabled).length} loaded`,
    ramUsed: serverState.ram ? `${serverState.ram.used} / ${serverState.ram.total} GB` : '—',
    cpu: `${serverState.cpu}%`,
    diskUsed: serverState.disk ? `${serverState.disk.used} / ${serverState.disk.total} GB` : '—',
    container: 'Railway (Nixpacks)',
    uptime: `${Math.floor(serverState.uptime / 3600)}h ${Math.floor((serverState.uptime % 3600) / 60)}m`,
    nodeUptime: '2d 4h',
  });
});

// GET /api/system/info
app.get('/api/system/info', (req, res) => {
  res.json({
    serverName: 'Railway MC Server',
    motd: currentRawProperties['motd'] || 'A Minecraft Server Powered by Railway',
    version: `Paper 1.20.4 (build ${paperBuildVersion})`,
    worldName: worldData.name || 'world',
    worldSize: worldData.size || '248 MB',
    port: currentRawProperties['server-port'] || '25565',
    maxPlayers: currentRawProperties['max-players'] || '20',
    onlineMode: currentRawProperties['online-mode'] === 'true' ? 'Enabled' : 'Disabled',
  });
});

// GET /api/system/updates
app.get('/api/system/updates', (req, res) => {
  res.json({
    paper: {
      current: paperBuildVersion,
      latest: 512,
      updateAvailable: paperBuildVersion < 512,
    },
    plugins: {
      count: 2,
    },
    app: {
      current: 'v1.0.0',
      latest: 'v1.0.0',
      updateAvailable: false,
    },
  });
});

// POST /api/system/check-updates
app.post('/api/system/check-updates', (req, res) => {
  res.json({
    paper: {
      current: paperBuildVersion,
      latest: 512,
      updateAvailable: paperBuildVersion < 512,
    },
    plugins: { count: 2 },
    app: { current: 'v1.0.0', latest: 'v1.0.0', updateAvailable: false },
    checkedAt: new Date().toISOString(),
  });
});

// POST /api/system/update/paper
app.post('/api/system/update/paper', (req, res) => {
  paperBuildVersion = 512;
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Downloading PaperMC build 512...'));
  setTimeout(() => {
    broadcastLog(createLog('INFO', '[Server thread/INFO]: PaperMC updated to build 512. Restarting server container...'));
  }, 1000);
  res.json({ success: true, current: 512, latest: 512, updateAvailable: false });
});

// GET /api/system/logs/download
app.get('/api/system/logs/download', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="server.log"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  const fullLog = logs.map((l) => `[${l.timestamp}] [${l.level}]: ${l.message}`).join('\n');
  res.send(fullLog || '[No logs recorded]');
});

// POST /api/system/logs/clear
app.post('/api/system/logs/clear', (req, res) => {
  logs = [createLog('INFO', '[Server thread/INFO]: Log buffer truncated and cleared by admin.')];
  res.json({ success: true, message: 'Logs cleared' });
});

// POST /api/system/cache/clear
app.post('/api/system/cache/clear', (req, res) => {
  broadcastLog(createLog('INFO', '[Server thread/INFO]: Cleared temporary chunk and entity caches (142 MB freed)'));
  res.json({ success: true, freed: '142 MB' });
});

// POST /api/system/restart-container
app.post('/api/system/restart-container', (req, res) => {
  broadcastLog(createLog('WARN', '[Railway Daemon]: Container reboot requested. Graceful shutdown in progress...'));
  serverState.status = 'starting';
  setTimeout(() => {
    serverState.status = 'running';
    serverState.uptime = 0;
    broadcastLog(createLog('INFO', '[Railway Daemon]: Container restarted cleanly. All services running.'));
  }, 2500);
  res.json({ success: true, message: 'Container restarted' });
});

// POST /api/system/kill
app.post('/api/system/kill', (req, res) => {
  broadcastLog(createLog('FATAL', '[Server thread/FATAL]: Process forcefully killed (SIGKILL) by admin.'));
  serverState.status = 'stopped';
  serverState.players = 0;
  serverState.tps = 0;
  serverState.cpu = 0;
  res.json({ success: true, message: 'Process killed' });
});

// Backups State & Endpoints
interface BackupItem {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  type: 'manual' | 'auto';
  locked: boolean;
  isLatest: boolean;
  worldName: string;
}

let backupsStorage = {
  used: 0,
  total: 5.0,
};

let autoBackupConfig = {
  enabled: false,
  frequency: 'Daily',
  time: '03:00',
  keep: 5,
};

let backupSequence = 1;
let backupsList: BackupItem[] = [];

// GET /api/backups
app.get('/api/backups', (req, res) => {
  res.json({
    storage: backupsStorage,
    auto: autoBackupConfig,
    list: backupsList,
  });
});

// POST /api/backups { name? }
app.post('/api/backups', (req, res) => {
  const customName = req.body?.name?.trim();
  const name = customName || `Backup #${backupSequence++}`;

  // Unmark previous isLatest
  backupsList.forEach((b) => (b.isLatest = false));

  const newBackup: BackupItem = {
    id: `backup-${Date.now()}`,
    name,
    size: '248 MB',
    createdAt: new Date().toISOString(),
    type: 'manual',
    locked: false,
    isLatest: true,
    worldName: worldData.name || 'world',
  };

  backupsList.unshift(newBackup);
  worldData.lastBackup = newBackup.createdAt;
  serverState.world.lastBackup = newBackup.createdAt;

  broadcastLog(createLog('INFO', `[Server thread/INFO]: Created world backup [${newBackup.name}]`));
  res.json({ success: true, backup: newBackup });
});

// POST /api/backups/:id/restore
app.post('/api/backups/:id/restore', (req, res) => {
  const { id } = req.params;
  const backup = backupsList.find((b) => b.id === id);
  if (!backup) return res.status(404).json({ error: 'Backup not found' });

  broadcastLog(createLog('WARN', `[Server thread/WARN]: Restoring world from ${backup.name}. Rebuilding chunk indexes...`));
  setTimeout(() => {
    broadcastLog(createLog('INFO', `[Server thread/INFO]: World restore complete for ${backup.name}. Restarting server container...`));
  }, 1500);

  res.json({ success: true, message: `Restored ${backup.name}` });
});

// GET /api/backups/:id/download
app.get('/api/backups/:id/download', (req, res) => {
  const { id } = req.params;
  const backup = backupsList.find((b) => b.id === id);
  const filename = backup ? `${backup.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip` : 'backup.zip';
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/zip');
  res.send(Buffer.from('PK\x05\x06' + '\x00'.repeat(18))); // Empty mock zip
});

// PATCH /api/backups/:id { name }
app.patch('/api/backups/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const backup = backupsList.find((b) => b.id === id);
  if (!backup) return res.status(404).json({ error: 'Backup not found' });

  backup.name = name.trim();
  res.json({ success: true, backup });
});

// POST /api/backups/:id/duplicate
app.post('/api/backups/:id/duplicate', (req, res) => {
  const { id } = req.params;
  const original = backupsList.find((b) => b.id === id);
  if (!original) return res.status(404).json({ error: 'Backup not found' });

  const clone: BackupItem = {
    ...original,
    id: `backup-${Date.now()}`,
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    locked: false,
    isLatest: false,
  };

  backupsList.unshift(clone);
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Duplicated backup ${original.name}`));
  res.json({ success: true, backup: clone });
});

// POST /api/backups/:id/lock { locked }
app.post('/api/backups/:id/lock', (req, res) => {
  const { id } = req.params;
  const { locked } = req.body;
  const backup = backupsList.find((b) => b.id === id);
  if (!backup) return res.status(404).json({ error: 'Backup not found' });

  backup.locked = Boolean(locked);
  res.json({ success: true, backup });
});

// DELETE /api/backups/:id
app.delete('/api/backups/:id', (req, res) => {
  const { id } = req.params;
  const index = backupsList.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Backup not found' });

  const deleted = backupsList.splice(index, 1)[0];
  if (deleted.isLatest && backupsList.length > 0) {
    backupsList[0].isLatest = true;
  }
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Deleted backup [${deleted.name}]`));
  res.json({ success: true, deleted });
});

// POST /api/backups/auto { enabled, frequency, time, keep }
app.post('/api/backups/auto', (req, res) => {
  autoBackupConfig = { ...autoBackupConfig, ...req.body };
  broadcastLog(createLog('INFO', `[Server thread/INFO]: Auto-backup configuration updated (${autoBackupConfig.enabled ? 'ON' : 'OFF'} - ${autoBackupConfig.frequency})`));
  res.json({ success: true, auto: autoBackupConfig });
});

// DELETE /api/backups/bulk { filter }
app.delete('/api/backups/bulk', (req, res) => {
  const { filter } = req.body || {};
  let deletedCount = 0;

  if (filter === 'keep5') {
    let unlockedSeen = 0;
    backupsList = backupsList.filter((b) => {
      if (b.locked) return true;
      unlockedSeen++;
      if (unlockedSeen > 5) {
        deletedCount++;
        return false;
      }
      return true;
    });
  } else if (filter === 'older30') {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
    backupsList = backupsList.filter((b) => {
      if (b.locked) return true;
      const t = new Date(b.createdAt).getTime();
      if (t < thirtyDaysAgo) {
        deletedCount++;
        return false;
      }
      return true;
    });
  } else if (filter === 'auto') {
    backupsList = backupsList.filter((b) => {
      if (b.locked) return true;
      if (b.type === 'auto') {
        deletedCount++;
        return false;
      }
      return true;
    });
  }

  if (backupsList.length > 0 && !backupsList.some((b) => b.isLatest)) {
    backupsList[0].isLatest = true;
  }

  broadcastLog(createLog('INFO', `[Server thread/INFO]: Cleaned up ${deletedCount} old backup archives.`));
  res.json({ success: true, deletedCount, list: backupsList });
});

// Vite middleware integration for full-stack dev/prod
async function bootstrap() {
  const server = http.createServer(app);

  // Setup WebSocket Server on /ws/logs
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    if (pathname === '/ws/logs') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    // Send immediate initial ping or state confirmation
    ws.on('close', () => {
      wsClients.delete(ws);
    });
    ws.on('error', () => {
      wsClients.delete(ws);
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MC RailAdmin running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
