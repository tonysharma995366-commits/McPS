import React, { memo } from 'react';
import { Menu } from 'lucide-react';

/**
 * Top App Bar (fixed top, height 52px)
 * Left: hamburger icon (22px)
 * Center: dynamic title
 * Right: 8px server status dot (gray=loading, green=running, red=stopped, yellow=starting with pulse)
 */
const TopBar = memo(function TopBar({
  title = 'Dashboard',
  status = null,
  connectionIndicator = null, // 'live' | 'polling' | 'disconnected' | null
  onOpenDrawer,
}) {
  let dotColor = 'bg-[#6b7280]';
  let isPulsing = false;
  let statusText = 'Unknown';

  if (connectionIndicator) {
    if (connectionIndicator === 'live') {
      dotColor = 'bg-[#4ade80]';
      statusText = 'Live (WS)';
    } else if (connectionIndicator === 'polling') {
      dotColor = 'bg-[#fbbf24]';
      isPulsing = true;
      statusText = 'Polling (Fallback)';
    } else if (connectionIndicator === 'disconnected') {
      dotColor = 'bg-[#ef4444]';
      statusText = 'Disconnected';
    }
  } else if (status) {
    const normalizedStatus = (status || '').toLowerCase();
    if (normalizedStatus === 'running') {
      dotColor = 'bg-[#4ade80]';
      statusText = 'Running';
    } else if (normalizedStatus === 'stopped' || normalizedStatus === 'offline') {
      dotColor = 'bg-[#ef4444]';
      statusText = 'Stopped';
    } else if (normalizedStatus === 'starting' || normalizedStatus === 'restarting') {
      dotColor = 'bg-[#fbbf24]';
      isPulsing = true;
      statusText = 'Starting';
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[52px] pt-[env(safe-area-inset-top)] bg-[#0f1115]/95 backdrop-blur-sm border-b border-[#262a33]">
      <div className="max-w-[480px] mx-auto h-full px-3 flex items-center justify-between">
        {/* Left Hamburger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open menu drawer"
          className="w-[44px] h-[44px] flex items-center justify-center text-[#e5e7eb] hover:text-[#4ade80] transition-colors duration-150 -ml-1 cursor-pointer"
        >
          <Menu size={22} />
        </button>

        {/* Center Title */}
        <h1 className="text-[16px] font-semibold text-[#e5e7eb] truncate max-w-[260px] text-center select-none">
          {title}
        </h1>

        {/* Right Status Dot */}
        <div className="w-[44px] h-[44px] flex items-center justify-end -mr-1" title={`Server: ${statusText}`}>
          <div className="relative flex items-center justify-center">
            <span
              className={`
                w-2 h-2 rounded-full ${dotColor}
                ${isPulsing ? 'animate-pulse ring-2 ring-[#fbbf24]/40' : ''}
              `}
            />
          </div>
        </div>
      </div>
    </header>
  );
});

export default TopBar;
