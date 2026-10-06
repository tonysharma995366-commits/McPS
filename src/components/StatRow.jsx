import React from 'react';

/**
 * 3-column evenly spaced statistical summary row.
 * Label: 12px secondary (#9ca3af)
 * Value: 18px semibold (#e5e7eb)
 */
export default function StatRow({ stats = [] }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center py-1">
      {stats.map((stat, idx) => (
        <div key={idx} className="flex flex-col items-center justify-center">
          <span className="text-[12px] text-[#9ca3af] font-normal leading-tight">
            {stat.label}
          </span>
          <span className="text-[18px] font-semibold text-[#e5e7eb] mt-1 tracking-tight leading-tight">
            {stat.value ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
