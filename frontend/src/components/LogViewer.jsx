import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal, ArrowDown } from 'lucide-react';
import LogLine from './LogLine.jsx';
import { safeString } from '../lib/safeString.js';

/**
 * Scrollable Log Viewer
 * - Background #0a0c10, rounded-top 8px
 * - Auto-scroll on new entries unless scrolled up > 40px
 * - Floating "↓ Jump to latest" pill button
 * - Lightweight DOM slice if list > 300 lines
 * - Stable key generation (log.id or hash)
 */
export default function LogViewer({ logs = [], isLoading = false }) {
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const isAutoScrollingRef = useRef(false);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = false) => {
    if (!containerRef.current) return;
    isAutoScrollingRef.current = true;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 150);
  }, []);

  // Monitor user scroll position: if > 40px from bottom, turn off autoScroll
  const handleScroll = () => {
    if (!containerRef.current || isAutoScrollingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom > 40) {
      if (autoScroll) setAutoScroll(false);
    } else {
      if (!autoScroll) setAutoScroll(true);
    }
  };

  // When logs change, if autoScroll is enabled, scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom(false);
    }
  }, [logs.length, autoScroll, scrollToBottom]);

  // Jump to latest handler
  const handleJumpToLatest = () => {
    setAutoScroll(true);
    scrollToBottom(true);
  };

  // Lightweight performance optimization: if > 300 logs, slice to latest 300
  const displayLogs = logs.length > 300 ? logs.slice(-300) : logs;

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-[#0a0c10] rounded-t-[8px] border-t border-x border-[#262a33] overflow-hidden">
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain"
        tabIndex={0}
        aria-label="Minecraft console logs"
      >
        {displayLogs.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center p-6 text-center select-none">
            <Terminal size={32} className="text-[#6b7280] mb-2.5 animate-pulse" />
            <p className="text-[13px] text-[#9ca3af]">
              {isLoading ? 'Connecting to console...' : 'Waiting for server output...'}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {logs.length > 300 && (
              <div className="text-center py-1 text-[11px] text-[#6b7280] border-b border-[#14171c]">
                Showing recent {displayLogs.length} of {logs.length} lines
              </div>
            )}
            {displayLogs.map((log, index) => {
              const uniqueKey = log.id || `${log.timestamp}-${index}-${safeString(log.message, 16)}`;
              return <LogLine key={uniqueKey} log={log} />;
            })}
          </div>
        )}
      </div>

      {/* Floating "Jump to latest" pill button */}
      {!autoScroll && logs.length > 0 && (
        <button
          type="button"
          onClick={handleJumpToLatest}
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4ade80] text-[#0f1115] text-[12px] font-semibold shadow-lg hover:bg-[#22c55e] active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ArrowDown size={14} />
          <span>Jump to latest</span>
        </button>
      )}
    </div>
  );
}
