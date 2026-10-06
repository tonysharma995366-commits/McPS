/**
 * Formatting utilities for system metrics, uptime, and timestamps.
 */

export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
  if (typeof bytes === 'string') {
    // Already formatted e.g. "1.2 GB"
    return bytes;
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return `${bytes} B`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatUptime(seconds) {
  if (!seconds || seconds <= 0 || isNaN(seconds)) {
    return 'Offline';
  }
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) {
    return `Up ${d}d ${h}h`;
  }
  if (h > 0) {
    return `Up ${h}h ${m}m`;
  }
  if (m > 0) {
    return `Up ${m}m ${s}s`;
  }
  return `Up ${s}s`;
}

export function timeAgo(timestamp) {
  if (!timestamp) return 'Never';
  if (typeof timestamp === 'string' && timestamp.includes('ago')) {
    return timestamp;
  }

  const date = typeof timestamp === 'number' 
    ? new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp) 
    : new Date(timestamp);

  if (isNaN(date.getTime())) {
    return String(timestamp);
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
