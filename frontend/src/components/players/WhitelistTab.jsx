import React from 'react';
import { Shield, Plus, X } from 'lucide-react';
import Card from '../Card.jsx';
import Toggle from '../Toggle.jsx';
import Avatar from './Avatar.jsx';
import SkeletonCard from '../SkeletonCard.jsx';

/**
 * Tab 2: Whitelist Management
 */
export default function WhitelistTab({
  whitelist = { enabled: false, players: [] },
  isLoading = false,
  onToggleWhitelist,
  onOpenAddModal,
  onRequestRemovePlayer,
}) {
  if (isLoading && (!whitelist.players || whitelist.players.length === 0)) {
    return (
      <div className="space-y-3">
        <SkeletonCard rows={2} height="h-28" />
        <SkeletonCard rows={2} height="h-28" />
      </div>
    );
  }

  const players = whitelist.players || [];

  return (
    <div className="space-y-3 select-none">
      {/* Whitelist Master Toggle Card */}
      <Card className="flex items-center justify-between gap-3">
        <div className="pr-1">
          <h3 className="text-[14px] font-semibold text-[#e5e7eb] leading-snug">
            Whitelist Enabled
          </h3>
          <p className="text-[12px] text-[#9ca3af] leading-tight mt-0.5">
            Only listed players can join
          </p>
        </div>
        <Toggle
          checked={Boolean(whitelist.enabled)}
          onChange={onToggleWhitelist}
        />
      </Card>

      {/* Add Player Full-Width Ghost Button */}
      <button
        type="button"
        onClick={onOpenAddModal}
        className="w-full min-h-[44px] rounded-[8px] bg-[#1a1d24] hover:bg-[#262a33] border border-[#262a33] border-dashed text-[#4ade80] text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer active:scale-[0.99]"
      >
        <Plus size={16} />
        <span>Add Player to Whitelist</span>
      </button>

      {/* Whitelist Members List */}
      {players.length === 0 ? (
        <div className="rounded-[12px] p-8 bg-[#1a1d24] border border-[#262a33] flex flex-col items-center justify-center text-center">
          <Shield size={32} className="text-[#6b7280] mb-2" />
          <h4 className="text-[14px] font-semibold text-[#e5e7eb] mb-0.5">
            Whitelist is empty
          </h4>
          <p className="text-[12px] text-[#6b7280]">
            Add players to restrict access
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((item) => (
            <div
              key={item.name}
              className="rounded-[12px] p-[12px] bg-[#1a1d24] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={item.name} size={36} />
                <div className="min-w-0">
                  <span className="text-[14px] font-semibold text-[#e5e7eb] block truncate">
                    {item.name}
                  </span>
                  <span className="text-[11.5px] text-[#9ca3af] block truncate mt-0.5">
                    Added {item.addedAt || 'recently'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRequestRemovePlayer(item.name)}
                aria-label={`Remove ${item.name} from whitelist`}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors duration-150 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
