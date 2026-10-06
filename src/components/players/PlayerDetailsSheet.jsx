import React from 'react';
import { Copy, Navigation, Heart, Utensils, Zap, Globe, Hash } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import Avatar from './Avatar.jsx';

/**
 * Detailed player profile & quick control sub-sheet
 */
export default function PlayerDetailsSheet({
  player,
  isOpen,
  onClose,
  onAction,
  onCopy,
}) {
  if (!player) return null;

  const posText = player.pos ? `${player.pos.x}, ${player.pos.y}, ${player.pos.z}` : '—';
  const healthVal = player.health !== undefined ? player.health : 20;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Player Details">
      <div className="space-y-4">
        {/* Profile Card Header */}
        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#0f1115] border border-[#262a33]">
          <Avatar name={player.name} size={44} />
          <div className="min-w-0 flex-1">
            <h4 className="text-[16px] font-bold text-[#e5e7eb] truncate">
              {player.name}
            </h4>
            <div className="flex items-center gap-2 text-[12px] text-[#9ca3af] mt-0.5">
              <span>{player.gamemode || 'Survival'}</span>
              <span>·</span>
              <span className="text-[#4ade80] font-mono">{player.ping || 50}ms</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Teleport to spawn, Heal, Feed */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onAction(player.name, 'teleport')}
            className="min-h-[44px] py-2 px-1 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[12px] font-medium flex flex-col items-center justify-center gap-1 transition-colors duration-150 cursor-pointer"
          >
            <Navigation size={15} className="text-[#60a5fa]" />
            <span>TP Spawn</span>
          </button>
          <button
            type="button"
            onClick={() => onAction(player.name, 'heal')}
            className="min-h-[44px] py-2 px-1 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[12px] font-medium flex flex-col items-center justify-center gap-1 transition-colors duration-150 cursor-pointer"
          >
            <Heart size={15} className="text-[#ef4444]" />
            <span>Heal</span>
          </button>
          <button
            type="button"
            onClick={() => onAction(player.name, 'feed')}
            className="min-h-[44px] py-2 px-1 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[12px] font-medium flex flex-col items-center justify-center gap-1 transition-colors duration-150 cursor-pointer"
          >
            <Utensils size={15} className="text-[#fbbf24]" />
            <span>Feed</span>
          </button>
        </div>

        {/* Detailed Attributes Grid */}
        <div className="space-y-2 text-[12.5px] bg-[#0f1115] border border-[#262a33] rounded-[10px] p-3">
          {/* UUID */}
          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#1f232b]">
            <span className="text-[#9ca3af] flex items-center gap-1.5 shrink-0">
              <Hash size={14} className="text-[#6b7280]" />
              <span>UUID</span>
            </span>
            <button
              type="button"
              onClick={() => onCopy(player.uuid || '—', 'UUID copied!')}
              className="flex items-center gap-1 font-mono text-[11px] text-[#e5e7eb] hover:text-[#4ade80] truncate max-w-[200px]"
              title="Click to copy UUID"
            >
              <span className="truncate">{player.uuid || '—'}</span>
              <Copy size={12} className="shrink-0" />
            </button>
          </div>

          {/* IP (Masked) */}
          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#1f232b]">
            <span className="text-[#9ca3af] flex items-center gap-1.5 shrink-0">
              <Globe size={14} className="text-[#6b7280]" />
              <span>IP Address</span>
            </span>
            <button
              type="button"
              onClick={() => onCopy(player.ip || '192.168.1.***', 'IP copied!')}
              className="flex items-center gap-1 font-mono text-[11px] text-[#e5e7eb] hover:text-[#4ade80]"
              title="Click to copy IP"
            >
              <span>{player.ip || '192.168.1.***'}</span>
              <Copy size={12} className="shrink-0" />
            </button>
          </div>

          {/* Health */}
          <div className="flex items-center justify-between py-1 border-b border-[#1f232b]">
            <span className="text-[#9ca3af] flex items-center gap-1.5">
              <Heart size={14} className="text-[#ef4444]" />
              <span>Health</span>
            </span>
            <span className="font-semibold text-[#e5e7eb]">
              {healthVal} / 20 HP
            </span>
          </div>

          {/* XP Level */}
          <div className="flex items-center justify-between py-1 border-b border-[#1f232b]">
            <span className="text-[#9ca3af] flex items-center gap-1.5">
              <Zap size={14} className="text-[#fbbf24]" />
              <span>XP Level</span>
            </span>
            <span className="font-semibold text-[#4ade80]">
              Level {player.xp !== undefined ? player.xp : 0}
            </span>
          </div>

          {/* Position (x, y, z) */}
          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#1f232b]">
            <span className="text-[#9ca3af] flex items-center gap-1.5 shrink-0">
              <Navigation size={14} className="text-[#60a5fa]" />
              <span>Position</span>
            </span>
            <button
              type="button"
              onClick={() => onCopy(posText, 'Position copied!')}
              className="flex items-center gap-1 font-mono text-[11px] text-[#e5e7eb] hover:text-[#4ade80]"
            >
              <span>{posText}</span>
              <Copy size={12} className="shrink-0" />
            </button>
          </div>

          {/* Dimension */}
          <div className="flex items-center justify-between py-1">
            <span className="text-[#9ca3af] flex items-center gap-1.5">
              <Globe size={14} className="text-[#a78bfa]" />
              <span>Dimension</span>
            </span>
            <span className="font-medium text-[#e5e7eb]">
              {player.dimension || 'Overworld'}
            </span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
