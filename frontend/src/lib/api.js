/**
 * API Client for MC RailAdmin
 * Handles all communication with the Minecraft server management backend.
 */

import { API_URL, WS_URL } from './config.js';
import { errorMsg } from './safe.js';

const BASE_URL = API_URL;

// Network failure tracking for NetworkBanner
let consecutiveFailures = 0;
const failureListeners = new Set();

export function onNetworkStatusChange(listener) {
  failureListeners.add(listener);
  return () => failureListeners.delete(listener);
}

function notifyNetworkStatus(isConnectionIssue) {
  for (const listener of failureListeners) {
    try {
      listener(isConnectionIssue);
    } catch {
      // ignore
    }
  }
}

/**
 * Generic fetch wrapper with timeout, json parsing, and error propagation.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  if (!config.signal) {
    config.signal = controller.signal;
  }

  try {
    const res = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!res.ok) {
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        notifyNetworkStatus(true);
      }
      let data = null;
      try { data = await res.json(); } catch {}
      const msg = errorMsg(data) || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    if (consecutiveFailures >= 3) {
      notifyNetworkStatus(false);
    }
    consecutiveFailures = 0;

    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    consecutiveFailures++;
    if (consecutiveFailures >= 3) {
      notifyNetworkStatus(true);
    }
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export const api = {
  // Generic HTTP helpers
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  // Health & Ping
  getHealth: (signal) => request('/api/health', { signal }),
  ping: (signal) => request('/api/ping', { signal }),

  // Server Status
  getStatus: () => request('/api/status'),

  // Playit.gg Tunnel Management
  getPlayit: (signal) => request('/api/playit', { signal }),
  claimPlayit: () => request('/api/playit/claim', { method: 'POST' }),
  reconnectPlayit: () => request('/api/playit/reconnect', { method: 'POST' }),
  retryPlayit: () => request('/api/playit/retry', { method: 'POST' }),
  regeneratePlayitClaim: () => request('/api/playit/regenerate', { method: 'POST' }),

  // Server Lifecycle Actions
  startServer: () => request('/api/server/start', { method: 'POST' }),
  stopServer: () => request('/api/server/stop', { method: 'POST' }),
  restartServer: () => request('/api/server/restart', { method: 'POST' }),
  backupServer: () => request('/api/server/backup', { method: 'POST' }),

  // Logs
  getLogs: (limit = 200) => request(`/api/logs?limit=${encodeURIComponent(limit)}`),
  getLogsSince: (since) => request(`/api/logs?since=${encodeURIComponent(since)}`),

  // Console Commands
  sendCommand: (command) =>
    request('/api/console', {
      method: 'POST',
      body: JSON.stringify({ command }),
    }),

  // WebSocket URL builder
  getLogsWsUrl: () => {
    if (WS_URL) return `${WS_URL}/ws/logs`;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/logs`;
  },

  // Performance Toggle
  setPerformanceMode: (enabled) =>
    request('/api/performance', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  // Player Management
  getOnlinePlayers: (signal) => request('/api/players/online', { signal }),
  getWhitelist: (signal) => request('/api/players/whitelist', { signal }),
  toggleWhitelist: (enabled) =>
    request('/api/players/whitelist/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
  addWhitelistPlayer: (name) =>
    request('/api/players/whitelist', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  removeWhitelistPlayer: (name) =>
    request(`/api/players/whitelist/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
  getOps: (signal) => request('/api/players/ops', { signal }),
  setOp: (name, level) =>
    request('/api/players/op', {
      method: 'POST',
      body: JSON.stringify({ name, level }),
    }),
  getBans: (signal) => request('/api/players/bans', { signal }),
  banPlayer: (name, reason) =>
    request('/api/players/ban', {
      method: 'POST',
      body: JSON.stringify({ name, reason }),
    }),
  unbanPlayer: (name) =>
    request('/api/players/unban', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  kickPlayer: (name, reason) =>
    request('/api/players/kick', {
      method: 'POST',
      body: JSON.stringify({ name, reason }),
    }),
  playerAction: (name, action, args) =>
    request('/api/players/action', {
      method: 'POST',
      body: JSON.stringify({ name, action, args }),
    }),

  // Plugins Management
  getPlugins: (signal) => request('/api/plugins', { signal }),
  getPluginUpdates: (signal) => request('/api/plugins/updates', { signal }),
  installPluginFromUrl: (url, name) =>
    request('/api/plugins/install-url', {
      method: 'POST',
      body: JSON.stringify({ url, name }),
    }),
  installPluginFromStore: (id) =>
    request('/api/plugins/install-store', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  togglePlugin: (id, enabled) =>
    request(`/api/plugins/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
  reloadPlugin: (id) =>
    request(`/api/plugins/${encodeURIComponent(id)}/reload`, {
      method: 'POST',
    }),
  updatePlugin: (id) =>
    request(`/api/plugins/${encodeURIComponent(id)}/update`, {
      method: 'POST',
    }),
  resetPluginConfig: (id) =>
    request(`/api/plugins/${encodeURIComponent(id)}/reset-config`, {
      method: 'POST',
    }),
  deletePlugin: (id) =>
    request(`/api/plugins/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  reloadAllPlugins: () =>
    request('/api/plugins/reload-all', {
      method: 'POST',
    }),

  // File Upload with XMLHttpRequest for real progress
  uploadPlugin: (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${BASE_URL}/api/plugins/upload`;
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            resolve({ success: true });
          }
        } else {
          let parsed = null;
          try { parsed = JSON.parse(xhr.responseText); } catch {}
          const errMsg = errorMsg(parsed) || `Upload failed with status ${xhr.status}`;
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.open('POST', url, true);
      xhr.send(formData);
    });
  },

  // World & Settings
  getWorld: (signal) => request('/api/world', { signal }),
  backupWorld: () => request('/api/world/backup', { method: 'POST' }),
  getDownloadWorldUrl: () => `${BASE_URL}/api/world/download`,
  regenerateWorld: (seed, backup = true) =>
    request('/api/world/regenerate', {
      method: 'POST',
      body: JSON.stringify({ seed, backup }),
    }),
  deleteWorld: () => request('/api/world', { method: 'DELETE' }),

  uploadWorld: (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${BASE_URL}/api/world/upload`;
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            resolve({ success: true });
          }
        } else {
          let parsed = null;
          try { parsed = JSON.parse(xhr.responseText); } catch {}
          const errMsg = errorMsg(parsed) || `Upload failed with status ${xhr.status}`;
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.open('POST', url, true);
      xhr.send(formData);
    });
  },

  // Game Rules
  getGameRules: (signal) => request('/api/world/gamerules', { signal }),
  setGameRule: (rule, value) =>
    request('/api/world/gamerule', {
      method: 'POST',
      body: JSON.stringify({ rule, value }),
    }),

  // Server Properties
  getServerProperties: (signal) => request('/api/properties', { signal }),
  updateServerProperties: (payload) =>
    request('/api/properties', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetServerProperties: (keys = []) =>
    request('/api/properties/reset', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    }),
  saveRawProperties: (rawText) =>
    request('/api/properties/raw', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    }),

  // System Wipe
  wipeSystem: () => request('/api/system/wipe', { method: 'POST' }),

  // Backups Management
  getBackups: (signal) => request('/api/backups', { signal }),
  createBackup: (name) =>
    request('/api/backups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  restoreBackup: (id) =>
    request(`/api/backups/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
    }),
  getDownloadBackupUrl: (id) => `${BASE_URL}/api/backups/${encodeURIComponent(id)}/download`,
  renameBackup: (id, name) =>
    request(`/api/backups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  duplicateBackup: (id) =>
    request(`/api/backups/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
    }),
  lockBackup: (id, locked) =>
    request(`/api/backups/${encodeURIComponent(id)}/lock`, {
      method: 'POST',
      body: JSON.stringify({ locked }),
    }),
  deleteBackup: (id) =>
    request(`/api/backups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  updateAutoBackup: (config) =>
    request('/api/backups/auto', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  bulkDeleteBackups: (filter) =>
    request('/api/backups/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ filter }),
    }),

  // System Diagnostics, Updates, & Maintenance
  getSystemChecks: (signal) => request('/api/system/checks', { signal }),
  getSystemDiagnostics: (signal) => request('/api/system/diagnostics', { signal }),
  getSystemInfo: (signal) => request('/api/system/info', { signal }),
  getSystemUpdates: (signal) => request('/api/system/updates', { signal }),
  checkSystemUpdates: () => request('/api/system/check-updates', { method: 'POST' }),
  updatePaper: () => request('/api/system/update/paper', { method: 'POST' }),
  getDownloadSystemLogsUrl: () => `${BASE_URL}/api/system/logs/download`,
  clearSystemLogs: () => request('/api/system/logs/clear', { method: 'POST' }),
  clearSystemCache: () => request('/api/system/cache/clear', { method: 'POST' }),
  restartContainer: () => request('/api/system/restart-container', { method: 'POST' }),
  killServer: () => request('/api/system/kill', { method: 'POST' }),

  // Clipboard helper (optional server-side logging/clipboard)
  copyText: (text) =>
    request('/api/copy', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }).catch(() => null), // Non-blocking
};
