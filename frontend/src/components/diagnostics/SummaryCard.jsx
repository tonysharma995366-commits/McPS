import React, { useState, useEffect } from 'react';
import { Play, RotateCw, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import HealthRing from './HealthRing.jsx';

/**
 * Top Summary Card for Self-Diagnostics
 * Shows circular health gauge, status breakdown, last verified timer, and control toggles.
 */
export default function SummaryCard({
  summary,
  lastChecked,
  isRunningAll,
  onRunAll,
  autoRefresh,
  onToggleAutoRefresh,
}) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastChecked) return;
    const updateTime = () => {
      const sec = Math.max(0, Math.floor((Date.now() - new Date(lastChecked).getTime()) / 1000));
      setSecondsAgo(sec);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastChecked]);

  const {
    passed = 0,
    total = 0,
    warnings = 0,
    failed = 0,
    health = 'GOOD',
  } = summary || {};

  const getHealthColor = () => {
    switch (health) {
      case 'EXCELLENT':
        return 'text-[#4ade80]';
      case 'GOOD':
        return 'text-[#4ade80]';
      case 'WARNING':
        return 'text-[#fbbf24]';
      case 'CRITICAL':
        return 'text-[#ef4444]';
      default:
        return 'text-[#e5e7eb]';
    }
  };

  const formatAgo = () => {
    if (!lastChecked) return 'Checking now...';
    if (secondsAgo < 5) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    const mins = Math.floor(secondsAgo / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="rounded-[14px] bg-[#1a1d24] border border-[#262a33] p-4 select-none shadow-md space-y-3.5">
      {/* Top Health Header with Circular Ring */}
      <div className="flex items-center gap-4">
        <HealthRing
          passed={passed}
          total={total}
          health={health}
          size={74}
          strokeWidth={6.5}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-[#e5e7eb] tracking-tight">
              {passed} / {total}
            </h2>
            <span className="text-[12px] text-[#9ca3af] font-medium">checks passed</span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[13px] font-semibold text-[#9ca3af]">Health:</span>
            <span className={`text-[13px] font-bold ${getHealthColor()}`}>
              {health}
            </span>
          </div>

          <p className="text-[11.5px] text-[#9ca3af] mt-1">
            Last checked: <span className="text-[#e5e7eb] font-medium">{formatAgo()}</span>
          </p>
        </div>
      </div>

      {/* Status Breakdown Pills */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#262a33]/60">
        <div className="p-2 rounded-[8px] bg-[#0a0c10] border border-[#262a33] flex items-center justify-center gap-1.5 text-[12px]">
          <CheckCircle2 size={13} className="text-[#4ade80]" />
          <span className="font-semibold text-[#4ade80]">{passed}</span>
          <span className="text-[#9ca3af] text-[11px]">passed</span>
        </div>

        <div className="p-2 rounded-[8px] bg-[#0a0c10] border border-[#262a33] flex items-center justify-center gap-1.5 text-[12px]">
          <AlertTriangle size={13} className="text-[#fbbf24]" />
          <span className="font-semibold text-[#fbbf24]">{warnings}</span>
          <span className="text-[#9ca3af] text-[11px]">warnings</span>
        </div>

        <div className="p-2 rounded-[8px] bg-[#0a0c10] border border-[#262a33] flex items-center justify-center gap-1.5 text-[12px]">
          <XCircle size={13} className="text-[#ef4444]" />
          <span className="font-semibold text-[#ef4444]">{failed}</span>
          <span className="text-[#9ca3af] text-[11px]">failed</span>
        </div>
      </div>

      {/* Control Actions Row */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onRunAll}
          disabled={isRunningAll}
          className="flex-1 h-[38px] rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isRunningAll ? (
            <Loader2 size={14} className="animate-spin text-[#0f1115]" />
          ) : (
            <Play size={14} className="fill-current" />
          )}
          <span>{isRunningAll ? 'Running Checks...' : 'Run All Checks'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleAutoRefresh}
          className={`px-3 h-[38px] rounded-[8px] border text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            autoRefresh
              ? 'bg-[#262a33] border-[#4ade80]/40 text-[#4ade80]'
              : 'bg-[#1a1d24] border-[#262a33] text-[#9ca3af] hover:text-[#e5e7eb]'
          }`}
          title="Auto-refresh checks every 30 seconds"
        >
          <RotateCw size={13} className={autoRefresh ? 'text-[#4ade80]' : ''} />
          <span>Auto: {autoRefresh ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
}
