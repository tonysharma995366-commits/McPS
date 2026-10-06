import React from 'react';
import { Users } from 'lucide-react';
import PlayerRow from './PlayerRow.jsx';
import SkeletonCard from '../SkeletonCard.jsx';

/**
 * Tab 1: Online Players list
 */
export default function OnlineTab({
  players = [],
  maxPlayers = 20,
  isLoading = false,
  onOpenActions,
}) {
  if (isLoading && players.length === 0) {
    return (
      <div className="space-y-2">
        <SkeletonCard rows={2} height="h-24" />
        <SkeletonCard rows={2} height="h-24" />
      </div>
    );
  }

  return (
    <div>
      {/* Header Info Row */}
      <div className="flex items-center justify-between text-[12px] text-[#9ca3af] px-1 mb-2 font-medium">
        <span>{players.length} online</span>
        <span>Max {maxPlayers}</span>
      </div>

      {/* Players List or Empty State */}
      {players.length === 0 ? (
        <div className="rounded-[12px] p-8 bg-[#1a1d24] border border-[#262a33] flex flex-col items-center justify-center text-center">
          <Users size={32} className="text-[#6b7280] mb-2" />
          <h4 className="text-[14px] font-semibold text-[#e5e7eb] mb-0.5">
            No players online
          </h4>
          <p className="text-[12px] text-[#6b7280]">
            Server is waiting for players
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <PlayerRow
              key={player.name}
              player={player}
              onOpenActions={onOpenActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
