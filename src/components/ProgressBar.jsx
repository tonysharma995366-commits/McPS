import React from 'react';

/**
 * Metric row with a 6px progress bar
 * Fill color:
 * - <70%: #4ade80 (green)
 * - 70-89%: #fbbf24 (yellow)
 * - >=90%: #ef4444 (red)
 */
export default function ProgressBar({ label, percentage = 0, valueText = '' }) {
  const safePercent = Math.min(100, Math.max(0, isNaN(percentage) ? 0 : percentage));

  let barColor = 'bg-[#4ade80]';
  if (safePercent >= 90) {
    barColor = 'bg-[#ef4444]';
  } else if (safePercent >= 70) {
    barColor = 'bg-[#fbbf24]';
  }

  return (
    <div className="flex items-center justify-between gap-3 text-[13px] py-1.5">
      <span className="w-12 text-[#9ca3af] font-medium shrink-0">
        {label}
      </span>
      <div className="flex-1 h-[6px] rounded-full bg-[#262a33] overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-150 ease-out`}
          style={{ width: `${safePercent}%` }}
        />
      </div>
      <span className="w-24 text-right text-[#e5e7eb] font-medium tabular-nums shrink-0 text-[12px]">
        {valueText || `${Math.round(safePercent)}%`}
      </span>
    </div>
  );
}
