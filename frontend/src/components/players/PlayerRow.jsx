import React, { memo } from 'react';
import { MoreVertical } from 'lucide-react';
import Avatar from './Avatar.jsx';

/**
 * Single Online Player Row inside a Card
 * Left: Avatar + Name & Meta info
 * Right: Ping + Kebab button
 */
const PlayerRow = memo(function PlayerRow({ player, onOpenActions }) {
  const ping = typeof player.ping === 'number' ? player.ping : 50;

  let pingColor = 'text-[#4ade80]'; // < 50ms
  if (ping > 150) {
    pingColor = 'text-[#ef4444]';
  } else if (ping >= 50) {
    pingColor = 'text-[#fbbf24]';
  }

  return (
    <div className="rounded-[12px] p-[12px] mb-2 bg-[#1a1d24] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm select-none">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={player.name} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-[#e5e7eb] truncate">
              {player.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11.5px] text-[#9ca3af] mt-0.5 truncate">
            {player.op && (
              <span className="bg-[#4ade80]/15 text-[#4ade80] text-[10px] font-semibold px-1.5 py-0.5 rounded-[6px] shrink-0 leading-tight">
                OP
              </span>
            )}
            <span className="truncate">{player.gamemode || 'Survival'}</span>
            <span className="text-[#6b7280]">·</span>
            <span className="shrink-0">{player.session || 'Just joined'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[12px] font-mono font-medium ${pingColor}`}>
          {ping}ms
        </span>
        <button
          type="button"
          onClick={() => onOpenActions(player)}
          aria-label={`Actions for ${player.name}`}
          className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
});

export default PlayerRow;
