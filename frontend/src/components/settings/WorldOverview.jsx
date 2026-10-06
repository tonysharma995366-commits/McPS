import React from 'react';
import { Globe, Copy, RotateCw } from 'lucide-react';
import Card from '../Card.jsx';
import { timeAgo } from '../../lib/format.js';

/**
 * Section 1: World Overview (always visible at top of page)
 */
export default function WorldOverview({
  world = {},
  isRefreshing = false,
  onRefresh,
  onCopy,
}) {
  const seed = world.seed || '—';
  const size = world.size || '—';
  const lastBackupStr = world.lastBackup ? timeAgo(world.lastBackup) : '—';
  const uptimeStr = world.uptime || '—';

  return (
    <Card className="mb-3">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262a33]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[10px] bg-[#4ade80]/15 flex items-center justify-center shrink-0">
            <Globe size={22} className="text-[#4ade80]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#e5e7eb] truncate">
              {world.name || 'world'}
            </h2>
            <p className="text-[11.5px] text-[#9ca3af] truncate mt-0.5">
              {world.type || 'Survival'} · {world.difficulty || 'Normal'}
            </p>
          </div>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh world information"
          className="p-2 rounded-[8px] text-[#9ca3af] hover:text-[#4ade80] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer disabled:opacity-50 shrink-0"
          title="Refresh world stats"
        >
          <RotateCw size={16} className={isRefreshing ? 'animate-spin text-[#4ade80]' : ''} />
        </button>
      </div>

      {/* Info Rows */}
      <div className="space-y-2 pt-3 text-[12.5px]">
        {/* Size */}
        <div className="flex items-center justify-between">
          <span className="text-[#9ca3af]">Size</span>
          <span className="text-[#e5e7eb] font-medium">{size}</span>
        </div>

        {/* Seed (copyable) */}
        <div className="flex items-center justify-between">
          <span className="text-[#9ca3af]">Seed</span>
          <button
            type="button"
            onClick={() => seed !== '—' && onCopy(seed, 'Seed copied to clipboard!')}
            className={`flex items-center gap-1.5 font-mono text-[12px] text-[#e5e7eb] ${
              seed !== '—' ? 'hover:text-[#4ade80] cursor-pointer' : 'cursor-default'
            } transition-colors duration-150 max-w-[200px] truncate group`}
            title={seed !== '—' ? 'Click to copy seed' : ''}
          >
            <span className="truncate">{seed}</span>
            {seed !== '—' && <Copy size={13} className="text-[#9ca3af] group-hover:text-[#4ade80] shrink-0" />}
          </button>
        </div>

        {/* Last Backup */}
        <div className="flex items-center justify-between">
          <span className="text-[#9ca3af]">Last Backup</span>
          <span className="text-[#e5e7eb] font-medium">{lastBackupStr}</span>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <span className="text-[#9ca3af]">Uptime</span>
          <span className="text-[#e5e7eb] font-medium">{uptimeStr}</span>
        </div>
      </div>
    </Card>
  );
}
