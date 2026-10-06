import React from 'react';
import { Info, Shield, ShieldAlert, LogOut, Ban, Copy, X } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import Avatar from './Avatar.jsx';

/**
 * Bottom Sheet for quick actions on an online player
 */
export default function PlayerActionSheet({
  player,
  isOpen,
  onClose,
  onViewDetails,
  onToggleOp,
  onKick,
  onBan,
  onCopyName,
}) {
  if (!player) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {/* Header with Player Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#262a33]">
          <Avatar name={player.name} size={40} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-semibold text-[#e5e7eb] truncate">
              {player.name}
            </h3>
            <p className="text-[12px] text-[#9ca3af] truncate">
              {player.op ? 'Operator' : 'Player'} · {player.gamemode || 'Survival'}
            </p>
          </div>
        </div>

        {/* Action List */}
        <div className="space-y-1">
          {/* View Details */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewDetails(player);
            }}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center gap-3 text-[14px] text-[#e5e7eb] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <Info size={18} className="text-[#60a5fa] shrink-0" />
            <span>View Details</span>
          </button>

          {/* OP / DeOP */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleOp(player);
            }}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center gap-3 text-[14px] text-[#e5e7eb] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            {player.op ? (
              <>
                <ShieldAlert size={18} className="text-[#fbbf24] shrink-0" />
                <span>Demote from Operator (DeOP)</span>
              </>
            ) : (
              <>
                <Shield size={18} className="text-[#4ade80] shrink-0" />
                <span>Make Operator (OP)</span>
              </>
            )}
          </button>

          {/* Copy Name */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onCopyName(player.name);
            }}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center gap-3 text-[14px] text-[#e5e7eb] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <Copy size={18} className="text-[#9ca3af] shrink-0" />
            <span>Copy Name</span>
          </button>

          {/* Kick */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onKick(player);
            }}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center gap-3 text-[14px] text-[#fbbf24] hover:bg-[#fbbf24]/10 transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={18} className="text-[#fbbf24] shrink-0" />
            <span>Kick Player</span>
          </button>

          {/* Ban */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onBan(player);
            }}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center gap-3 text-[14px] text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors duration-150 cursor-pointer"
          >
            <Ban size={18} className="text-[#ef4444] shrink-0" />
            <span>Ban Player</span>
          </button>

          {/* Divider */}
          <div className="border-t border-[#262a33] my-2" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center justify-center gap-2 text-[14px] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <X size={18} />
            <span>Close</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
