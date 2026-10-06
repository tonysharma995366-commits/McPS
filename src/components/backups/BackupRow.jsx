import React, { memo } from 'react';
import { Archive, Clock, MoreVertical, Lock } from 'lucide-react';
import { timeAgo } from '../../lib/format.js';

const BackupRow = memo(function BackupRow({
  backup,
  onOpenActions,
}) {
  const isAuto = backup.type === 'auto';
  const timeFormatted = backup.createdAt ? timeAgo(backup.createdAt) : 'Recently';

  return (
    <div className="rounded-[12px] p-[12px] mb-2 bg-[#1a1d24] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm select-none">
      {/* Left Icon (40x40 rounded-8, bg #262a33) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-[8px] bg-[#262a33] flex items-center justify-center shrink-0">
          {isAuto ? (
            <Clock size={20} className="text-[#60a5fa]" />
          ) : (
            <Archive size={20} className="text-[#4ade80]" />
          )}
        </div>

        {/* Middle Metadata */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Name + Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-semibold text-[#e5e7eb] truncate">
              {backup.name || 'Backup'}
            </span>
            {backup.isLatest && (
              <span className="bg-[#4ade80]/15 text-[#4ade80] text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] leading-tight shrink-0">
                Latest
              </span>
            )}
            {backup.locked && (
              <Lock size={12} className="text-[#fbbf24] shrink-0" title="Locked backup" />
            )}
          </div>

          {/* Row 2: Relative time · Size · Type */}
          <div className="text-[11.5px] text-[#9ca3af] mt-0.5 truncate">
            <span>{timeFormatted}</span>
            <span className="text-[#6b7280] mx-1">·</span>
            <span>{backup.size || '248 MB'}</span>
            <span className="text-[#6b7280] mx-1">·</span>
            <span className="capitalize">{backup.type || 'Manual'}</span>
          </div>
        </div>
      </div>

      {/* Right Kebab Button */}
      <button
        type="button"
        onClick={() => onOpenActions(backup)}
        aria-label={`Actions for ${backup.name}`}
        className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer shrink-0"
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );
});

export default BackupRow;
