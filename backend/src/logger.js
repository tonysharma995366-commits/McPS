/**
 * Lightweight logger for MC RailAdmin backend.
 * Provides timestamps, log levels, and conditional ANSI coloring.
 */

const isTTY = Boolean(process.stdout.isTTY);

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  info: '\x1b[32m',    // Green
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[36m',   // Cyan
};

function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatMessage(level, message, ...args) {
  const ts = formatTimestamp();
  const formattedArgs = args.length > 0 ? ' ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') : '';
  const text = `${message}${formattedArgs}`;

  if (!isTTY) {
    return `[${ts}] [${level.toUpperCase()}] ${text}`;
  }

  const color = COLORS[level.toLowerCase()] || COLORS.reset;
  return `${COLORS.dim}[${ts}]${COLORS.reset} ${color}[${level.toUpperCase()}]${COLORS.reset} ${text}`;
}

export const log = {
  info(message, ...args) {
    console.log(formatMessage('INFO', message, ...args));
  },
  warn(message, ...args) {
    console.warn(formatMessage('WARN', message, ...args));
  },
  error(message, ...args) {
    console.error(formatMessage('ERROR', message, ...args));
  },
  debug(message, ...args) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.debug(formatMessage('DEBUG', message, ...args));
    }
  },
};
