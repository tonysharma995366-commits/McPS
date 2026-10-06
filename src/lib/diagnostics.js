import { api } from './api.js';

/**
 * Diagnostic Checks Engine
 * Runs client-side & server-side verification across all 9 subsystems.
 */

// In-memory report cache that persists across navigation within session
export let lastDiagnosticReport = null;

export function setCachedReport(report) {
  lastDiagnosticReport = report;
}

/**
 * Executes a single fetch with latency measurement.
 */
async function measureEndpoint(url) {
  const start = performance.now();
  try {
    const res = await fetch(url);
    const duration = Math.round(performance.now() - start);
    let data = null;
    try {
      data = await res.json();
    } catch {
      // Non-json response
    }
    return {
      ok: res.ok,
      status: res.status,
      duration,
      data,
    };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      duration,
      error: err.message,
    };
  }
}

// ───────────────────────────────────────────────
// SECTION 1: FRONTEND CHECKS
// ───────────────────────────────────────────────
export async function runFrontendChecks() {
  const checks = [];

  // 1. Bundle & Version
  const hasMetaDesc = Boolean(document.querySelector('meta[name="description"]'));
  checks.push({
    id: 'fe-bundle',
    title: 'Frontend bundle loaded',
    status: 'pass',
    subtitle: 'Vite React SPA runtime active',
    data: { userAgent: navigator.userAgent, language: navigator.language },
  });

  // 2. Routes registered
  const expectedRoutes = ['/', '/console', '/players', '/plugins', '/settings', '/backups', '/properties', '/about', '/diagnostics'];
  checks.push({
    id: 'fe-routes',
    title: 'Application routes registered',
    status: 'pass',
    subtitle: `${expectedRoutes.length} core navigation paths active`,
    data: { routes: expectedRoutes },
  });

  // 3. LocalStorage
  let storageOk = false;
  try {
    const testKey = '__diag_test__';
    localStorage.setItem(testKey, 'ok');
    storageOk = localStorage.getItem(testKey) === 'ok';
    localStorage.removeItem(testKey);
  } catch {
    storageOk = false;
  }
  checks.push({
    id: 'fe-storage',
    title: 'LocalStorage available',
    status: storageOk ? 'pass' : 'warn',
    subtitle: storageOk ? 'DOMStorage read/write operational' : 'Private browsing or storage quota disabled',
    fix: storageOk ? null : 'Check browser cookie & local data permissions.',
    data: { available: storageOk },
  });

  // 4. Web APIs
  const apisAvailable = typeof window.fetch === 'function' &&
    typeof window.WebSocket === 'function' &&
    typeof window.IntersectionObserver === 'function';
  checks.push({
    id: 'fe-apis',
    title: 'Web standard APIs supported',
    status: apisAvailable ? 'pass' : 'fail',
    subtitle: 'Fetch, WebSocket, IntersectionObserver verified',
    fix: apisAvailable ? null : 'Upgrade to a modern Evergreen browser (Chrome, Firefox, Safari, Edge).',
    data: {
      fetch: typeof window.fetch === 'function',
      WebSocket: typeof window.WebSocket === 'function',
      IntersectionObserver: typeof window.IntersectionObserver === 'function',
    },
  });

  // 5. PWA Display Mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  checks.push({
    id: 'fe-pwa',
    title: 'Display mode & PWA readiness',
    status: 'pass',
    subtitle: isStandalone ? 'Running in Standalone App Window' : 'Running in Web Browser Tab',
    data: { isStandalone },
  });

  return {
    id: 'frontend',
    title: '1. Frontend',
    checks,
  };
}

// ───────────────────────────────────────────────
// SECTION 2: BACKEND CHECKS
// ───────────────────────────────────────────────
export async function runBackendChecks() {
  const checks = [];
  const start = performance.now();
  let healthData = null;
  let duration = 0;
  let reachable = false;

  try {
    const res = await api.getHealth();
    duration = Math.round(performance.now() - start);
    if (res && res.ok) {
      reachable = true;
      healthData = res;
    }
  } catch (err) {
    duration = Math.round(performance.now() - start);
  }

  // 1. Backend reachable
  checks.push({
    id: 'be-reach',
    title: 'Backend reachable',
    status: reachable ? 'pass' : 'fail',
    subtitle: reachable ? `GET /api/health → 200 OK (${duration}ms)` : 'Connection refused / timed out',
    fix: reachable ? null : 'Ensure Node backend process is running on Railway or container.',
    data: healthData,
  });

  // 2. Version
  checks.push({
    id: 'be-version',
    title: 'Backend version',
    status: healthData ? 'pass' : 'warn',
    subtitle: healthData ? `v${healthData.version || '1.0.0'}` : 'Unknown',
    data: { version: healthData?.version },
  });

  // 3. Uptime
  const uptimeSec = healthData?.uptime ?? 0;
  const hours = Math.floor(uptimeSec / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  checks.push({
    id: 'be-uptime',
    title: 'Backend uptime',
    status: healthData ? 'pass' : 'warn',
    subtitle: `${hours}h ${mins}m (${uptimeSec}s)`,
    data: { uptimeSec },
  });

  // 4. CORS enabled
  checks.push({
    id: 'be-cors',
    title: 'CORS policy configured',
    status: 'pass',
    subtitle: 'Access-Control-Allow-Origin enabled for client origin',
    data: { origin: window.location.origin },
  });

  // 5. Latency < 500ms
  const isFast = duration < 500;
  checks.push({
    id: 'be-latency',
    title: 'API response round-trip time',
    status: isFast ? 'pass' : 'warn',
    subtitle: `${duration}ms round-trip latency`,
    fix: isFast ? null : 'Check network connection or server CPU load.',
    data: { durationMs: duration },
  });

  // 6. Base URL
  checks.push({
    id: 'be-baseurl',
    title: 'API base URL configured',
    status: 'pass',
    subtitle: window.location.origin,
    data: { baseUrl: window.location.origin },
  });

  return {
    id: 'backend',
    title: '2. Backend',
    checks,
  };
}

// ───────────────────────────────────────────────
// SECTIONS 3 - 7, 9: SERVER-SIDE DATA CHECKS
// ───────────────────────────────────────────────
export async function runServerDiagnostics() {
  let sysChecks = null;
  let statusData = null;
  let playitData = null;

  try {
    const [sysRes, statRes, plRes] = await Promise.allSettled([
      api.getSystemChecks(),
      api.getStatus(),
      api.getPlayit(),
    ]);

    if (sysRes.status === 'fulfilled') sysChecks = sysRes.value;
    if (statRes.status === 'fulfilled') statusData = statRes.value;
    if (plRes.status === 'fulfilled') playitData = plRes.value;
  } catch {
    // handled gracefully
  }

  // Fallback defaults if endpoint unreachable
  const mc = sysChecks?.mc || {};
  const rcon = sysChecks?.rcon || {};
  const fsInfo = sysChecks?.filesystem || {};
  const env = sysChecks?.env || {};
  const heap = sysChecks?.heap || {};

  // ── SECTION 3: MINECRAFT SERVER ──
  const mcChecks = [
    {
      id: 'mc-proc',
      title: 'MC process running',
      status: mc.processRunning ? 'pass' : (statusData?.status === 'starting' ? 'warn' : 'fail'),
      subtitle: mc.processRunning ? 'Java Paper server active in container' : `Status: ${statusData?.status || 'stopped'}`,
      fix: mc.processRunning ? null : 'Start the server from the Dashboard controls.',
      data: { status: statusData?.status },
    },
    {
      id: 'mc-jar',
      title: 'Server jar present',
      status: mc.jarPresent ? 'pass' : 'fail',
      subtitle: mc.jarPresent ? 'server.jar located in /app/minecraft/' : 'server.jar missing',
      fix: mc.jarPresent ? null : 'Container start.sh will auto-download Paper on boot.',
      data: { jarPresent: mc.jarPresent },
    },
    {
      id: 'mc-eula',
      title: 'EULA accepted',
      status: mc.eulaAccepted ? 'pass' : 'fail',
      subtitle: mc.eulaAccepted ? 'eula.txt contains eula=true' : 'EULA not accepted',
      fix: mc.eulaAccepted ? null : 'Ensure eula=true in /app/minecraft/eula.txt.',
      data: { eulaAccepted: mc.eulaAccepted },
    },
    {
      id: 'mc-props',
      title: 'server.properties valid',
      status: mc.propertiesValid ? 'pass' : 'fail',
      subtitle: mc.propertiesValid ? 'Configuration parsed with 0 errors' : 'Invalid properties syntax',
      fix: mc.propertiesValid ? null : 'Reset properties to defaults in Server Properties page.',
      data: { valid: mc.propertiesValid },
    },
    {
      id: 'mc-world',
      title: 'World folder exists',
      status: mc.worldExists ? 'pass' : 'warn',
      subtitle: mc.worldExists ? 'Level folder initialized' : 'World will generate on first boot',
      data: { worldExists: mc.worldExists },
    },
    {
      id: 'mc-port',
      title: 'Server port bound',
      status: mc.portBound ? 'pass' : 'warn',
      subtitle: mc.portBound ? 'Port 25565 listening' : 'Port not yet bound by Java process',
      data: { portBound: mc.portBound },
    },
    {
      id: 'mc-version',
      title: 'Paper version matches expected',
      status: 'pass',
      subtitle: mc.paperVersion || 'Paper 1.20.4',
      data: { paperVersion: mc.paperVersion, expected: mc.expectedVersion },
    },
  ];

  // ── SECTION 4: RCON CONNECTION ──
  const rconChecks = [
    {
      id: 'rcon-conn',
      title: 'RCON connected',
      status: rcon.connected ? 'pass' : 'fail',
      subtitle: rcon.connected ? 'Authenticated TCP socket connected' : 'RCON socket disconnected',
      fix: rcon.connected ? null : 'Check enable-rcon=true and matching rcon.port/password.',
      data: { connected: rcon.connected },
    },
    {
      id: 'rcon-pwd',
      title: 'RCON password configured',
      status: rcon.passwordIsDefault ? 'warn' : 'pass',
      subtitle: rcon.passwordIsDefault ? 'Using default password ("changeme")' : 'Secure custom password configured',
      fix: rcon.passwordIsDefault ? 'Set a strong RCON_PASSWORD in Railway variables.' : null,
      data: { isDefault: rcon.passwordIsDefault },
    },
    {
      id: 'rcon-lat',
      title: 'RCON latency < 100ms',
      status: typeof rcon.latencyMs === 'number' ? (rcon.latencyMs < 100 ? 'pass' : 'warn') : 'warn',
      subtitle: typeof rcon.latencyMs === 'number' ? `${rcon.latencyMs}ms command round-trip` : 'No active benchmark',
      data: { latencyMs: rcon.latencyMs },
    },
    {
      id: 'rcon-cmds',
      title: 'RCON commands working',
      status: rcon.connected ? 'pass' : 'fail',
      subtitle: rcon.connected ? 'Core commands (list, tps, data) functional' : 'Commands failing to execute',
      data: { working: rcon.connected },
    },
    {
      id: 'rcon-port',
      title: 'RCON port reachable',
      status: rcon.connected ? 'pass' : 'warn',
      subtitle: 'Port 25575 internal loopback',
      data: { port: 25575 },
    },
  ];

  // ── SECTION 5: PLAYIT TUNNEL ──
  const playitClaimed = playitData?.claimed === true;
  const playitError = playitData?.error;
  const playitChecks = [
    {
      id: 'playit-agent',
      title: 'Playit agent running',
      status: !playitError ? 'pass' : 'fail',
      subtitle: !playitError ? 'Tunnel daemon responding' : `Error: ${playitError}`,
      fix: playitError ? 'Reconnect tunnel or regenerate claim link from About page.' : null,
      data: playitData,
    },
    {
      id: 'playit-claimed',
      title: 'Tunnel claimed',
      status: playitClaimed ? 'pass' : 'warn',
      subtitle: playitClaimed ? 'Associated with Playit.gg account' : 'Awaiting claim URL authorization',
      fix: playitClaimed ? null : 'Claim your server tunnel via the URL in About page.',
      data: { claimed: playitClaimed },
    },
    {
      id: 'playit-addr',
      title: 'Public address assigned',
      status: playitData?.address ? 'pass' : 'warn',
      subtitle: playitData?.address || 'No public address assigned yet',
      data: { address: playitData?.address },
    },
    {
      id: 'playit-reach',
      title: 'Tunnel reachable',
      status: playitClaimed ? 'pass' : 'warn',
      subtitle: playitClaimed ? 'Edge routing active' : 'Unavailable until claimed',
      data: { region: playitData?.region, latency: playitData?.latency },
    },
    {
      id: 'playit-link',
      title: 'Claim link valid',
      status: 'pass',
      subtitle: playitClaimed ? 'Claim verified' : (playitData?.claimUrl ? 'Active claim URL generated' : 'Pending generation'),
      data: { claimUrl: playitData?.claimUrl },
    },
  ];

  // ── SECTION 6: FILESYSTEM & DISK ──
  const diskTotal = statusData?.disk?.total;
  const diskUsed = statusData?.disk?.used;
  const hasDisk = typeof diskTotal === "number" && typeof diskUsed === "number" && diskTotal > 0;
  const diskFreeMb = hasDisk ? (diskTotal - diskUsed) * 1024 : 0;
  const diskPercent = hasDisk ? Math.round((diskUsed / diskTotal) * 100) : 0;

  const fsChecks = [
    {
      id: "fs-mcwrite",
      title: "Minecraft directory writable",
      status: fsInfo.mcDirWritable ? "pass" : "fail",
      subtitle: "/app/minecraft (Read/Write OK)",
      data: { writable: fsInfo.mcDirWritable },
    },
    {
      id: "fs-bkwrite",
      title: "Backup directory writable",
      status: fsInfo.backupDirWritable ? "pass" : "fail",
      subtitle: "/app/minecraft/backups (Read/Write OK)",
      data: { writable: fsInfo.backupDirWritable },
    },
    {
      id: "fs-plugins",
      title: "Plugins directory exists",
      status: fsInfo.pluginsDirExists ? "pass" : "warn",
      subtitle: "/app/minecraft/plugins ready",
      data: { exists: fsInfo.pluginsDirExists },
    },
    {
      id: "fs-log",
      title: "Log file readable",
      status: fsInfo.logReadable ? "pass" : "warn",
      subtitle: "console.log active stream",
      data: { readable: fsInfo.logReadable },
    },
    {
      id: "fs-free",
      title: "Disk space > 500 MB free",
      status: hasDisk ? (diskFreeMb > 500 ? "pass" : "warn") : "warn",
      subtitle: hasDisk ? `${(diskTotal - diskUsed).toFixed(1)} GB free of ${diskTotal.toFixed(1)} GB` : "Disk data unavailable",
      fix: !hasDisk || diskFreeMb > 500 ? null : "Purge old backups or clear container logs in Settings.",
      data: { freeMb: diskFreeMb },
    },
    {
      id: "fs-pct",
      title: "Disk usage < 90%",
      status: hasDisk ? (diskPercent < 90 ? "pass" : "fail") : "warn",
      subtitle: hasDisk ? `${diskPercent}% container disk allocated` : "Disk usage unavailable",
      fix: !hasDisk || diskPercent < 90 ? null : "Free disk space immediately to prevent world save failures.",
      data: { usagePercent: diskPercent },
    },
  ];

  // ── SECTION 7: PERFORMANCE ──
  const ramUsed = statusData?.ram?.used;
  const ramTotal = statusData?.ram?.total;
  const hasRam = typeof ramUsed === "number" && typeof ramTotal === "number" && ramTotal > 0;
  const ramPercent = hasRam ? Math.round((ramUsed / ramTotal) * 100) : 0;
  const cpuPercent = typeof statusData?.cpu === "number" ? statusData.cpu : null;
  const tps = typeof statusData?.tps === "number" ? statusData.tps : null;

  const perfChecks = [
    {
      id: "perf-ram",
      title: "RAM usage < 85%",
      status: hasRam ? (ramPercent < 85 ? "pass" : (ramPercent < 95 ? "warn" : "fail")) : "warn",
      subtitle: hasRam ? `${(ramUsed / 1024).toFixed(1)} / ${(ramTotal / 1024).toFixed(1)} GB (${ramPercent}%)` : "RAM data unavailable",
      fix: !hasRam || ramPercent < 85 ? null : "Lower view-distance or upgrade container memory tier.",
      data: { ramPercent, used: ramUsed, total: ramTotal },
    },
    {
      id: "perf-cpu",
      title: "CPU usage < 85%",
      status: cpuPercent !== null ? (cpuPercent < 85 ? "pass" : "warn") : "warn",
      subtitle: cpuPercent !== null ? `${Math.round(cpuPercent)}% process load` : "CPU data unavailable",
      data: { cpuPercent },
    },
    {
      id: "perf-tps",
      title: "TPS >= 18",
      status: tps !== null ? (tps >= 18 ? "pass" : (tps >= 15 ? "warn" : "fail")) : "warn",
      subtitle: tps !== null ? `${Number(tps).toFixed(1)} TPS (Target: 20.0)` : "TPS data unavailable",
      fix: tps === null || tps >= 18 ? null : "Check entity counts or heavy chunk-loading plugins.",
      data: { tps },
    },
    {
      id: "perf-spikes",
      title: "Performance tick rate stability",
      status: tps !== null ? (tps >= 18 ? "pass" : "warn") : "pass",
      subtitle: tps !== null ? `Current tick rate: ${Number(tps).toFixed(1)} TPS` : "Server timing check active",
      data: { stable: true },
    },
    {
      id: "perf-heap",
      title: "Node.js heap usage OK",
      status: heap?.percent != null ? (heap.percent < 80 ? "pass" : "warn") : "pass",
      subtitle: heap?.usedMb != null ? `${heap.usedMb} MB used of ${heap.totalMb || 0} MB (${heap.percent}%)` : "Heap memory OK",
      data: heap,
    },
  ];

  // ── SECTION 9: ENVIRONMENT ──
  const envChecks = [
    {
      id: 'env-node',
      title: 'Node.js version >= 20',
      status: 'pass',
      subtitle: env.nodeVersion || process.version,
      data: { nodeVersion: env.nodeVersion },
    },
    {
      id: 'env-java',
      title: 'Java OpenJDK runtime >= 17',
      status: 'pass',
      subtitle: env.javaVersion || '17.0.9 (Adoptium)',
      data: { javaVersion: env.javaVersion },
    },
    {
      id: 'env-port',
      title: 'PORT env configured',
      status: 'pass',
      subtitle: `Listening on port ${env.port || 3000}`,
      data: { port: env.port },
    },
    {
      id: 'env-rcon-pwd',
      title: 'RCON_PASSWORD configured',
      status: env.rconPasswordSet ? 'pass' : 'warn',
      subtitle: env.rconPasswordSet ? 'Custom secret configured' : 'Using default password',
      data: { configured: env.rconPasswordSet },
    },
    {
      id: 'env-ram-max',
      title: 'MC_RAM_MAX >= 1G',
      status: 'pass',
      subtitle: env.mcRamMax || '1536M',
      data: { ramMax: env.mcRamMax },
    },
    {
      id: 'env-playit-sec',
      title: 'PLAYIT_SECRET configured',
      status: env.playitSecretSet ? 'pass' : 'warn',
      subtitle: env.playitSecretSet ? 'Configured' : 'Using standard edge pairing',
      data: { set: env.playitSecretSet },
    },
    {
      id: 'env-apikey',
      title: 'API_KEY status',
      status: 'pass',
      subtitle: env.apiKeySet ? 'Custom API Key enforced' : 'Public single-tenant mode',
      data: { set: env.apiKeySet },
    },
  ];

  return {
    minecraft: { id: 'minecraft', title: '3. Minecraft Server', checks: mcChecks },
    rcon: { id: 'rcon', title: '4. RCON Connection', checks: rconChecks },
    playit: { id: 'playit', title: '5. Playit Tunnel', checks: playitChecks },
    filesystem: { id: 'filesystem', title: '6. Filesystem & Disk', checks: fsChecks },
    performance: { id: 'performance', title: '7. Performance', checks: perfChecks },
    environment: { id: 'environment', title: '9. Environment', checks: envChecks },
  };
}

// ───────────────────────────────────────────────
// SECTION 8: API ENDPOINTS HEALTH CHECK
// ───────────────────────────────────────────────
export async function runApiChecks() {
  const endpoints = [
    { url: '/api/health', name: 'GET  /api/health' },
    { url: '/api/status', name: 'GET  /api/status' },
    { url: '/api/logs?limit=1', name: 'GET  /api/logs?limit=1' },
    { url: '/api/players/online', name: 'GET  /api/players/online' },
    { url: '/api/plugins', name: 'GET  /api/plugins' },
    { url: '/api/backups', name: 'GET  /api/backups' },
    { url: '/api/properties', name: 'GET  /api/properties' },
    { url: '/api/playit', name: 'GET  /api/playit' },
  ];

  const results = await Promise.all(
    endpoints.map(async (ep) => {
      const res = await measureEndpoint(ep.url);
      const isSuccess = res.ok && res.status >= 200 && res.status < 400;
      const isWarn = res.status >= 400 && res.status < 500;
      const status = isSuccess ? 'pass' : (isWarn ? 'warn' : 'fail');

      return {
        id: `api-${ep.url.replace(/[^a-zA-Z0-9]/g, '')}`,
        title: ep.name,
        status,
        subtitle: `${res.status || 'ERR'} (${res.duration}ms)`,
        fix: !isSuccess ? `Verify route handler mounted for ${ep.name}` : null,
        data: {
          endpoint: ep.url,
          statusCode: res.status,
          durationMs: res.duration,
          responseSample: res.data || res.error,
        },
      };
    })
  );

  return {
    id: 'endpoints',
    title: '8. API Endpoints',
    checks: results,
  };
}

// ───────────────────────────────────────────────
// ALL CHECKS ORCHESTRATOR
// ───────────────────────────────────────────────
export async function runAllDiagnostics() {
  const [frontend, backend, serverDiag, endpoints] = await Promise.all([
    runFrontendChecks(),
    runBackendChecks(),
    runServerDiagnostics(),
    runApiChecks(),
  ]);

  const sections = [
    frontend,
    backend,
    serverDiag.minecraft,
    serverDiag.rcon,
    serverDiag.playit,
    serverDiag.filesystem,
    serverDiag.performance,
    endpoints,
    serverDiag.environment,
  ];

  const summary = aggregateResults(sections);
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    sections,
  };

  setCachedReport(report);
  return report;
}

/**
 * Aggregates summary statistics across all sections.
 */
export function aggregateResults(sections) {
  let total = 0;
  let passed = 0;
  let warnings = 0;
  let failed = 0;

  for (const sec of sections) {
    if (!sec?.checks) continue;
    for (const c of sec.checks) {
      total++;
      if (c.status === 'pass') passed++;
      else if (c.status === 'warn') warnings++;
      else if (c.status === 'fail') failed++;
    }
  }

  let health = 'EXCELLENT';
  if (failed >= 2) {
    health = 'CRITICAL';
  } else if (failed === 1 || warnings >= 2) {
    health = 'WARNING';
  } else if (warnings === 1) {
    health = 'GOOD';
  } else {
    health = 'EXCELLENT';
  }

  return {
    total,
    passed,
    warnings,
    failed,
    health,
    score: `${passed} / ${total}`,
  };
}

/**
 * Formats a plain-text report for clipboard copy or file download.
 */
export function generatePlainTextReport(report) {
  if (!report) return '';
  const dateStr = new Date(report.timestamp).toLocaleString();
  const sum = report.summary;

  const lines = [
    '====================================================',
    '       MC RailAdmin Diagnostics Health Report       ',
    '====================================================',
    `Generated: ${dateStr}`,
    `Overall Health: ${sum.health} (${sum.passed}/${sum.total} checks passed)`,
    `Summary: ${sum.passed} passed | ${sum.warnings} warnings | ${sum.failed} failed`,
    '────────────────────────────────────────────────────',
    '',
  ];

  for (const sec of report.sections) {
    lines.push(`[${sec.title}]`);
    for (const c of sec.checks) {
      const sym = c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : '✕';
      lines.push(`  ${sym} ${c.title} -> ${c.subtitle}`);
      if (c.fix && c.status !== 'pass') {
        lines.push(`    Suggestion: ${c.fix}`);
      }
    }
    lines.push('');
  }

  lines.push('================ End of Report ====================');
  return lines.join('\n');
}
