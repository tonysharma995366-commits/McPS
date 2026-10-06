import React, { memo } from 'react';
import PluginIcon from './PluginIcon.jsx';
import Toggle from '../Toggle.jsx';

/**
 * Single Plugin Row inside a Card
 * Tapping the card opens details. Tapping toggle only toggles enable/disable.
 */
const PluginRow = memo(function PluginRow({
  plugin,
  onOpenDetails,
  onToggleEnabled,
}) {
  const isEnabled = Boolean(plugin.enabled);

  const handleToggleClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => onOpenDetails(plugin)}
      className="rounded-[12px] p-[12px] mb-2 bg-[#1a1d24] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm select-none cursor-pointer active:scale-[0.99] transition-transform duration-150"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <PluginIcon name={plugin.name} size={40} />
        <div className="min-w-0 flex-1">
          {/* Row 1: Name */}
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-[#e5e7eb] truncate">
              {plugin.name}
            </span>
          </div>

          {/* Row 2: Version & Size */}
          <div className="text-[11.5px] text-[#9ca3af] mt-0.5 truncate">
            <span>{plugin.version || 'v1.0.0'}</span>
            <span className="text-[#6b7280] mx-1">·</span>
            <span>{plugin.size || 'Unknown size'}</span>
          </div>

          {/* Row 3: Status Badges */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {plugin.updateAvailable && (
              <span className="bg-[#4ade80]/15 text-[#4ade80] text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] leading-tight">
                ⚠ Update
              </span>
            )}
            {!isEnabled && (
              <span className="bg-[#262a33] text-[#9ca3af] text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] leading-tight">
                Disabled
              </span>
            )}
            {plugin.error && (
              <span className="bg-[#ef4444]/15 text-[#ef4444] text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] leading-tight">
                Failed to load
              </span>
            )}
            {plugin.needsRestart && (
              <span className="bg-[#fbbf24]/15 text-[#fbbf24] text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] leading-tight">
                Restart required
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Toggle Switch */}
      <div onClick={handleToggleClick} className="shrink-0">
        <Toggle
          checked={isEnabled}
          onChange={(newVal) => onToggleEnabled(plugin, newVal)}
        />
      </div>
    </div>
  );
});

export default PluginRow;
