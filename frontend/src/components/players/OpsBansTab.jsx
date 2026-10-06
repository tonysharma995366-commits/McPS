import React from 'react';
import { Shield, Ban, Plus, UserMinus, ShieldCheck } from 'lucide-react';
import Avatar from './Avatar.jsx';
import SkeletonCard from '../SkeletonCard.jsx';

/**
 * Tab 3: Operators & Banned Players
 */
export default function OpsBansTab({
  operators = [],
  bans = [],
  isLoading = false,
  onOpenAddOpModal,
  onRequestDeop,
  onOpenBanModal,
  onRequestUnban,
}) {
  if (isLoading && operators.length === 0 && bans.length === 0) {
    return (
      <div className="space-y-4">
        <SkeletonCard rows={2} height="h-28" />
        <SkeletonCard rows={2} height="h-28" />
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none">
      {/* ── Section A: Operators ── */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Shield size={16} className="text-[#4ade80]" />
            <h3 className="text-[14px] font-semibold text-[#e5e7eb]">
              Operators ({operators.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenAddOpModal}
            className="text-[12px] font-medium text-[#4ade80] hover:bg-[#4ade80]/10 px-2.5 py-1 rounded-[6px] border border-[#4ade80]/30 flex items-center gap-1 transition-colors duration-150 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add OP</span>
          </button>
        </div>

        {operators.length === 0 ? (
          <div className="rounded-[12px] p-5 bg-[#1a1d24] border border-[#262a33] text-center text-[13px] text-[#6b7280]">
            No operators assigned
          </div>
        ) : (
          <div className="space-y-2">
            {operators.map((op) => (
              <div
                key={op.name}
                className="rounded-[12px] p-[12px] bg-[#1a1d24] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={op.name} size={36} color="#4ade80" />
                  <div className="min-w-0">
                    <span className="text-[14px] font-semibold text-[#e5e7eb] block truncate">
                      {op.name}
                    </span>
                    <span className="text-[11.5px] text-[#9ca3af] block truncate mt-0.5">
                      Level {op.level || 4} · since {op.since || 'recently'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRequestDeop(op.name)}
                  aria-label={`Demote ${op.name}`}
                  className="px-2.5 py-1 text-[12px] font-medium text-[#fbbf24] hover:bg-[#fbbf24]/10 rounded-[6px] border border-[#fbbf24]/30 transition-colors duration-150 cursor-pointer"
                >
                  DeOP
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section B: Banned Players ── */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Ban size={16} className="text-[#ef4444]" />
            <h3 className="text-[14px] font-semibold text-[#e5e7eb]">
              Bans ({bans.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenBanModal}
            className="text-[12px] font-medium text-[#ef4444] hover:bg-[#ef4444]/10 px-2.5 py-1 rounded-[6px] border border-[#ef4444]/30 flex items-center gap-1 transition-colors duration-150 cursor-pointer"
          >
            <Plus size={13} />
            <span>Ban Player</span>
          </button>
        </div>

        {bans.length === 0 ? (
          <div className="rounded-[12px] p-5 bg-[#1a1d24] border border-[#262a33] text-center text-[13px] text-[#6b7280]">
            No banned players
          </div>
        ) : (
          <div className="space-y-2">
            {bans.map((ban) => (
              <div
                key={ban.name}
                className="rounded-[12px] p-[12px] bg-[#1a1d24] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={ban.name} size={36} color="#ef4444" />
                  <div className="min-w-0">
                    <span className="text-[14px] font-semibold text-[#e5e7eb] block truncate">
                      {ban.name}
                    </span>
                    <span className="text-[11.5px] text-[#ef4444] block truncate mt-0.5">
                      Reason: {ban.reason || 'Banned'}
                    </span>
                    <span className="text-[10.5px] text-[#6b7280] block truncate">
                      By {ban.by || 'Admin'} · {ban.at || 'recently'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRequestUnban(ban.name)}
                  aria-label={`Unban ${ban.name}`}
                  className="px-2.5 py-1 text-[12px] font-medium text-[#4ade80] hover:bg-[#4ade80]/10 rounded-[6px] border border-[#4ade80]/30 transition-colors duration-150 cursor-pointer"
                >
                  Unban
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
