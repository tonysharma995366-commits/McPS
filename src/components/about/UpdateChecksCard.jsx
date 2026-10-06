import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import CollapsibleSection from '../settings/CollapsibleSection.jsx';

/**
 * Update Checks Card tracking core PaperMC build, plugins, and app version.
 */
export default function UpdateChecksCard({
  updates = {},
  isOpen = true,
  onToggle,
  onCheckUpdates,
  onRequestPaperUpdate,
  isChecking = false,
}) {
  const navigate = useNavigate();

  const paper = updates.paper || { current: null, latest: null, updateAvailable: false };
  const plugins = updates.plugins || { count: 0 };
  const app = updates.app || { current: 'v1.0.0', latest: 'v1.0.0', updateAvailable: false };

  const hasAnyUpdates = Boolean(paper.updateAvailable || plugins.count > 0 || app.updateAvailable);

  return (
    <CollapsibleSection
      title="Updates"
      isOpen={isOpen}
      onToggle={onToggle}
      badge={
        hasAnyUpdates ? (
          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30">
            Available
          </span>
        ) : null
      }
    >
      <div className="space-y-3 pt-1">
        {/* Update Rows */}
        <div className="divide-y divide-[#262a33]/60">
          {/* 1. Paper Server */}
          <div className="py-2.5 flex items-center justify-between gap-3 text-[12px]">
            <div>
              <p className="font-medium text-[#e5e7eb]">PaperMC Core</p>
              <p className="text-[11px] text-[#9ca3af] font-mono mt-0.5">
                {paper.current ? `Build #${paper.current}` : '—'} {paper.updateAvailable && paper.latest && `→ #${paper.latest}`}
              </p>
            </div>
            {paper.updateAvailable ? (
              <button
                type="button"
                onClick={onRequestPaperUpdate}
                className="h-[28px] px-2.5 rounded-[6px] bg-[#4ade80]/15 hover:bg-[#4ade80]/25 text-[#4ade80] border border-[#4ade80]/30 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowUpCircle size={13} />
                <span>Update available</span>
              </button>
            ) : (
              <span className="text-[11px] font-medium text-[#9ca3af] bg-[#262a33] px-2 py-0.5 rounded-[4px]">
                Up to date
              </span>
            )}
          </div>

          {/* 2. Plugins */}
          <div className="py-2.5 flex items-center justify-between gap-3 text-[12px]">
            <div>
              <p className="font-medium text-[#e5e7eb]">Installed Plugins</p>
              <p className="text-[11px] text-[#9ca3af] mt-0.5">
                {plugins.count > 0
                  ? `${plugins.count} update${plugins.count !== 1 ? 's' : ''} available`
                  : 'All plugins up to date'}
              </p>
            </div>
            {plugins.count > 0 ? (
              <button
                type="button"
                onClick={() => navigate('/plugins')}
                className="h-[28px] px-2.5 rounded-[6px] bg-[#4ade80]/15 hover:bg-[#4ade80]/25 text-[#4ade80] border border-[#4ade80]/30 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View</span>
              </button>
            ) : (
              <span className="text-[11px] font-medium text-[#9ca3af] bg-[#262a33] px-2 py-0.5 rounded-[4px]">
                Up to date
              </span>
            )}
          </div>

          {/* 3. App Panel */}
          <div className="py-2.5 flex items-center justify-between gap-3 text-[12px]">
            <div>
              <p className="font-medium text-[#e5e7eb]">Admin Panel Webapp</p>
              <p className="text-[11px] text-[#9ca3af] font-mono mt-0.5">
                Version {app.current || 'v1.0.0'}
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#9ca3af] bg-[#262a33] px-2 py-0.5 rounded-[4px]">
              Up to date
            </span>
          </div>
        </div>

        {/* Clean all-up-to-date state banner if no pending updates */}
        {!hasAnyUpdates && (
          <div className="p-2.5 rounded-[8px] bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center gap-1.5 text-[#4ade80] text-[12px] font-medium">
            <CheckCircle2 size={15} />
            <span>All system components are up to date</span>
          </div>
        )}

        {/* Check for updates bottom button */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            disabled={isChecking}
            onClick={onCheckUpdates}
            className="text-[11.5px] text-[#9ca3af] hover:text-[#e5e7eb] py-1 px-2.5 rounded-[6px] hover:bg-[#262a33] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <RotateCw size={12} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Checking...' : 'Check for Updates'}</span>
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
