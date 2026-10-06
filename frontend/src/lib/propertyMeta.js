/**
 * Metadata, category groups, type mappings, hints, and restart requirements
 * for all Minecraft server.properties keys.
 */

export const CATEGORIES = [
  {
    id: 'network',
    title: 'Network',
    description: 'Connection ports, IP binding, RCON, and authentication',
    keys: [
      'server-port',
      'server-ip',
      'enable-query',
      'query.port',
      'enable-rcon',
      'rcon.port',
      'rcon.password',
      'network-compression-threshold',
      'prevent-proxy-connections',
      'online-mode',
      'enforce-secure-profile',
    ],
  },
  {
    id: 'gameplay',
    title: 'Gameplay',
    description: 'Gamemode, difficulty, PVP, mobs, and player limits',
    keys: [
      'gamemode',
      'force-gamemode',
      'difficulty',
      'hardcore',
      'pvp',
      'allow-flight',
      'allow-nether',
      'allow-end',
      'spawn-monsters',
      'spawn-animals',
      'spawn-npcs',
      'generate-structures',
      'max-world-size',
      'player-idle-timeout',
      'max-players',
    ],
  },
  {
    id: 'world',
    title: 'World',
    description: 'Level name, seeds, chunk generation, and world bounds',
    keys: [
      'level-name',
      'level-seed',
      'level-type',
      'generator-settings',
      'spawn-protection',
      'view-distance',
      'simulation-distance',
      'max-tick-time',
      'sync-chunk-writes',
      'entity-broadcast-range-percentage',
      'max-entity-crush',
      'enable-command-block',
    ],
  },
  {
    id: 'chat',
    title: 'Chat & Messages',
    description: 'MOTD, console broadcasts, OP levels, and whitelist',
    keys: [
      'motd',
      'enable-status',
      'broadcast-console-to-ops',
      'broadcast-rcon-to-ops',
      'hide-online-players',
      'op-permission-level',
      'function-permission-level',
      'white-list',
      'enforce-whitelist',
      'log-ips',
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    description: 'Tick watchdog, view rendering, chunk compression, and transport',
    keys: [
      'max-tick-time',
      'sync-chunk-writes',
      'entity-broadcast-range-percentage',
      'network-compression-threshold',
      'view-distance',
      'simulation-distance',
      'use-native-transport',
      'rate-limit',
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Resource packs, JMX telemetry, and filtering',
    keys: [
      'text-filtering-config',
      'resource-pack',
      'resource-pack-sha1',
      'resource-pack-prompt',
      'require-resource-pack',
      'initial-enabled-packs',
      'initial-disabled-packs',
      'bug-report-link',
      'enable-jmx-monitoring',
      'enable-code-of-conduct',
    ],
  },
];

export const RESTART_REQUIRED_KEYS = new Set([
  'server-port',
  'server-ip',
  'level-name',
  'level-seed',
  'level-type',
  'online-mode',
  'white-list',
  'enforce-whitelist',
  'hardcore',
  'max-players',
  'view-distance',
  'simulation-distance',
  'max-tick-time',
  'enable-query',
  'query.port',
  'enable-rcon',
  'rcon.port',
  'rcon.password',
  'network-compression-threshold',
  'prevent-proxy-connections',
  'enforce-secure-profile',
  'sync-chunk-writes',
  'use-native-transport',
  'rate-limit',
  'enable-command-block',
  'enable-status',
  'hide-online-players',
  'log-ips',
  'enable-jmx-monitoring',
  'enable-code-of-conduct',
]);

export const LIVE_APPLYABLE_KEYS = new Set([
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

export const HINTS = {
  'server-port': 'Port the Minecraft server listens on (default 25565)',
  'server-ip': 'Specific local network interface IP to bind (usually blank)',
  'online-mode': 'Validates connecting players against Mojang accounts',
  'enable-rcon': 'Allows remote server console command execution',
  'rcon.port': 'Port for remote RCON management connections',
  'rcon.password': 'Secret authorization password for RCON clients',
  'enable-query': 'Enables GameSpy4 protocol server queries',
  'query.port': 'Port for GameSpy server querying',
  'network-compression-threshold': 'Packet size in bytes before gzip compression (-1 to disable)',
  'prevent-proxy-connections': 'Blocks connections from known VPNs and proxy servers',
  'enforce-secure-profile': 'Requires cryptographic chat signatures from players',

  'gamemode': 'Default game mode for new players entering the world',
  'force-gamemode': 'Forces existing players into default gamemode on join',
  'difficulty': 'Controls hostile mob damage, hunger, and world challenge',
  'hardcore': 'Permanently bans players upon death and locks difficulty to hard',
  'pvp': 'Enables damage between players',
  'allow-flight': 'Allows survival players to fly without getting kicked for hacking',
  'allow-nether': 'Allows players to travel through Nether portals',
  'allow-end': 'Allows players to enter the End dimension',
  'spawn-monsters': 'Spawns hostile creatures (zombies, skeletons, creepers)',
  'spawn-animals': 'Spawns passive friendly animals (cows, sheep, pigs)',
  'spawn-npcs': 'Spawns villagers and wandering traders',
  'generate-structures': 'Generates villages, dungeons, temples, and nether fortresses',
  'max-world-size': 'Maximum world border radius in blocks',
  'player-idle-timeout': 'Minutes before AFK idle players are kicked (0 = disabled)',
  'max-players': 'Maximum simultaneous player connections',

  'level-name': 'World directory folder name loaded on server boot',
  'level-seed': 'Seed string used for terrain generation algorithm',
  'level-type': 'Terrain generator preset (default, flat, amplified, etc.)',
  'generator-settings': 'JSON / custom preset settings for flat or custom worlds',
  'spawn-protection': 'Radius in blocks around spawn where non-OPs cannot edit blocks',
  'view-distance': 'Max chunk radius sent to clients (lower = less RAM/lag)',
  'simulation-distance': 'Chunk radius where mob AI, crops, and ticks are processed',
  'max-tick-time': 'Max ms per tick before watchdog restarts server (-1 = disabled)',
  'sync-chunk-writes': 'Synchronously writes chunk updates to disk',
  'entity-broadcast-range-percentage': 'Controls distance entities are rendered on client',
  'max-entity-crush': 'Max entities crammed in one block before taking suffocation damage',
  'enable-command-block': 'Enables execution of command blocks in the world',

  'motd': 'Message of the Day shown under server name in multiplayer list',
  'enable-status': 'Appears in server list ping queries',
  'broadcast-console-to-ops': 'Broadcasts console command execution to online OPs',
  'broadcast-rcon-to-ops': 'Broadcasts RCON execution logs to online OPs',
  'hide-online-players': 'Hides player list from server status ping',
  'op-permission-level': 'Default permission level granted by /op command (1-4)',
  'function-permission-level': 'Permission level for mcfunction files (1-4)',
  'white-list': 'Only players on whitelist.json are permitted to join',
  'enforce-whitelist': 'Kicks online players immediately if removed from whitelist',
  'log-ips': 'Logs player IP addresses to console and log files',

  'use-native-transport': 'Optimizes Linux network packet transport (epoll)',
  'rate-limit': 'Max packets per second per client before kicking (0 = disabled)',
  'text-filtering-config': 'Configuration for chat filtering endpoints',
  'resource-pack': 'Direct HTTPS download URL for required client resource pack',
  'resource-pack-sha1': 'SHA-1 checksum hash of resource pack file',
  'resource-pack-prompt': 'Custom prompt displayed to client asking to install pack',
  'require-resource-pack': 'Disconnects clients who decline resource pack download',
  'initial-enabled-packs': 'List of datapacks enabled by default',
  'initial-disabled-packs': 'List of datapacks disabled by default',
  'bug-report-link': 'Custom URL shown on crash reports',
  'enable-jmx-monitoring': 'Exposes server metrics over JMX MBeans',
  'enable-code-of-conduct': 'Displays community guidelines link on join',
};

export const DEFAULT_PROPERTIES = {
  // Network
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

  // Gameplay
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

  // World
  'level-name': 'world',
  'level-seed': '',
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

  // Chat & Messages
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

  // Performance
  'use-native-transport': 'true',
  'rate-limit': '0',

  // Advanced
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

/**
 * Humanizes key names like "network-compression-threshold" -> "Network Compression Threshold"
 */
export function humanizeKey(key) {
  if (!key) return '';
  if (key === 'motd') return 'Server MOTD';
  if (key === 'pvp') return 'PvP (Player vs Player)';
  if (key === 'rcon.password') return 'RCON Password';
  if (key === 'rcon.port') return 'RCON Port';
  if (key === 'query.port') return 'Query Port';
  if (key === 'spawn-npcs') return 'Spawn NPCs';
  if (key === 'log-ips') return 'Log Player IPs';
  if (key === 'enable-jmx-monitoring') return 'Enable JMX Monitoring';

  return key
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const DIFFICULTY_OPTIONS = [
  { label: 'Peaceful', value: 'peaceful' },
  { label: 'Easy', value: 'easy' },
  { label: 'Normal', value: 'normal' },
  { label: 'Hard', value: 'hard' },
];

export const GAMEMODE_OPTIONS = [
  { label: 'Survival', value: 'survival' },
  { label: 'Creative', value: 'creative' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Spectator', value: 'spectator' },
];

export const LEVEL_TYPE_OPTIONS = [
  { label: 'Default', value: 'minecraft:normal' },
  { label: 'Flat', value: 'minecraft:flat' },
  { label: 'Large Biomes', value: 'minecraft:large_biomes' },
  { label: 'Amplified', value: 'minecraft:amplified' },
  { label: 'Single Biome', value: 'minecraft:single_biome_surface' },
];

export const OP_PERMISSION_OPTIONS = [
  { label: '1 - Bypass', value: '1' },
  { label: '2 - Commands', value: '2' },
  { label: '3 - Manage', value: '3' },
  { label: '4 - Full OP', value: '4' },
];

export const SLIDER_CONFIGS = {
  'view-distance': { min: 2, max: 32, step: 1, helper: 'Chunk radius loaded per player' },
  'simulation-distance': { min: 2, max: 32, step: 1, helper: 'Chunk radius where mobs and plants tick' },
  'network-compression-threshold': { min: -1, max: 512, step: 32, helper: 'Size before gzip compression (-1 disabled)' },
  'entity-broadcast-range-percentage': { min: 10, max: 500, step: 10, helper: 'Entity visual rendering distance percentage' },
  'player-idle-timeout': { min: 0, max: 120, step: 5, helper: 'Minutes before AFK kick (0 disabled)' },
  'spawn-protection': { min: 0, max: 64, step: 1, helper: 'Spawn protection radius in blocks' },
};

/**
 * Determine input type for a given property key and value
 */
export function getPropertyInputType(key, value) {
  const v = String(value ?? '').toLowerCase();
  if (v === 'true' || v === 'false') return 'toggle';
  if (key === 'difficulty') return 'difficulty_segmented';
  if (key === 'gamemode') return 'gamemode_segmented';
  if (key === 'level-type') return 'level_type_select';
  if (key === 'op-permission-level' || key === 'function-permission-level') return 'permission_segmented';
  if (SLIDER_CONFIGS[key]) return 'slider';
  if (key === 'rcon.password') return 'password';
  if (key.endsWith('-port') || key.endsWith('.port') || key === 'max-players' || key === 'max-tick-time' || key === 'max-entity-crush' || key === 'rate-limit') {
    return 'number';
  }
  return 'text';
}

/**
 * Validate a property key and value
 * Returns error string or null
 */
export function validateProperty(key, value) {
  if (key.endsWith('-port') || key.endsWith('.port')) {
    const num = Number(value);
    if (isNaN(num)) return 'Port must be a valid integer';
    if (num > 65535) return 'Port must not exceed 65535';
    if (num < 1) return 'Port must be greater than 0';
  }

  if (key === 'max-players') {
    const num = Number(value);
    if (isNaN(num) || num < 1) return 'Must allow at least 1 player';
    if (num > 1000) return 'Max players limit is 1000';
  }

  if (key === 'motd' && String(value || '').length > 128) {
    return 'MOTD must be 128 characters or fewer';
  }

  if (key === 'max-tick-time') {
    const num = Number(value);
    if (isNaN(num)) return 'Must be a number (-1 to disable)';
  }

  return null;
}
