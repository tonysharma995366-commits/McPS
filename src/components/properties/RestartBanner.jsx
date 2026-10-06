import React from 'react';
import { RotateCw, AlertTriangle, X } from 'lucide-react';

/**
 * Notice banner displayed after saving restart-requiring properties.
 * Provides immediate "Restart Now" and "Later" options.
 */
export default function RestartBanner({
  restartCount = 0,
  onRestartNow,
  onDismiss,
}) {
  if (restartCount <= 0) return null;

  return (
    <div className="rounded-[10px] bg-[#fbbf24]/10 border border-[#fbbf24]/30 p-3 mb-3 text-[#e5e7eb] select-none flex items-center justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center shrink-0">
          <AlertTriangle size={17} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#fbbf24] truncate">
            {restartCount} {restartCount === 1 ? 'setting needs' : 'settings need'} a restart
          </p>
          <p className="text-[11px] text-[#9ca3af] leading-tight">
            Saved to disk. Apply now or whenever convenient.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onDismiss}
          className="h-[32px] px-2.5 rounded-[6px] text-[#9ca3af] hover:text-[#e5e7eb] text-[12px] font-medium transition-colors cursor-pointer"
        >
          Later
        </button>
        <button
          type="button"
          onClick={onRestartNow}
          className="h-[32px] px-3 rounded-[6px] bg-[#ef4444] hover:bg-[#dc2626] text-white text-[12px] font-semibold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-sm"
        >
          <RotateCw size={12} />
          <span>Restart</span>
        </button>
      </div>
    </div>
  );
}
