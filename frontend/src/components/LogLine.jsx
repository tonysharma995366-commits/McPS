import React, { memo } from 'react';
import { toStr } from '../lib/safe.js';

/**
 * Format timestamp into HH:MM:SS
 */
function formatTime(timestamp) {
  if (!timestamp) return '00:00:00';
  if (typeof timestamp === 'string' && timestamp.includes('T')) {
    const timePart = timestamp.split('T')[1];
    return timePart.substring(0, 8);
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp).substring(0, 8);
  return date.toTimeString().substring(0, 8);
}

/**
 * Parse and normalize log level:
 * INFO, WARN, ERROR, CHAT, DEBUG
 */
function detectLevel(log) {
  if (log.isChat) return 'CHAT';
  
  const rawLevel = (log.level || '').toUpperCase();
  if (rawLevel.includes('WARN')) return 'WARN';
  if (rawLevel.includes('ERR')) return 'ERROR';
  if (rawLevel.includes('CHAT')) return 'CHAT';
  if (rawLevel.includes('DEBUG')) return 'DEBUG';
  if (rawLevel.includes('INFO')) return 'INFO';

  // Fallback regex matching in message
  const msg = toStr(log.message);
  if (/\[.*WARN.*\]/i.test(msg)) return 'WARN';
  if (/\[.*ERR.*\]/i.test(msg)) return 'ERROR';
  if (/^<.+>/.test(msg)) return 'CHAT';
  if (/\[.*DEBUG.*\]/i.test(msg)) return 'DEBUG';

  return 'INFO';
}

const LogLine = memo(function LogLine({ log }) {
  const level = detectLevel(log);
  const timeStr = formatTime(log.timestamp);
  const msgStr = toStr(log.message);
  const isCommandInput = log.isOptimisticCommand || msgStr.startsWith('>');

  // Color config per spec
  let levelColor = 'text-[#6b7280]';
  let messageColor = 'text-[#9ca3af]';

  if (level === 'WARN') {
    levelColor = 'text-[#fbbf24]';
    messageColor = 'text-[#fbbf24]';
  } else if (level === 'ERROR') {
    levelColor = 'text-[#ef4444]';
    messageColor = 'text-[#ef4444]';
  } else if (level === 'CHAT') {
    levelColor = 'text-[#4ade80]';
    messageColor = 'text-[#e5e7eb]';
  } else if (level === 'DEBUG') {
    levelColor = 'text-[#4b5563]';
    messageColor = 'text-[#4b5563]';
  }

  return (
    <div className="py-1 px-2.5 border-b border-[#14171c] font-mono text-[11.5px] leading-[1.5] break-words select-text">
      <span className="text-[#6b7280] mr-2 shrink-0 select-none">
        [{timeStr}]
      </span>
      <span className={`mr-2.5 font-semibold shrink-0 select-none ${levelColor}`}>
        {level}
      </span>
      {isCommandInput ? (
        <span className="text-[#e5e7eb]">
          <span className="text-[#4ade80] font-bold mr-1 select-none">&gt;</span>
          {msgStr.replace(/^>\s*/, '')}
        </span>
      ) : (
        <span className={messageColor}>{msgStr}</span>
      )}
    </div>
  );
});

export default LogLine;
