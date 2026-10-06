import React from 'react';

/**
 * Placeholder loading skeleton matching the Card design
 */
export default function SkeletonCard({ rows = 3, height = 'h-28' }) {
  return (
    <div className={`rounded-[12px] p-[14px] bg-[#1a1d24] border border-[#262a33] animate-pulse flex flex-col justify-between ${height}`}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-[#262a33] rounded-[4px]" />
        <div className="h-3 w-16 bg-[#262a33] rounded-[4px]" />
      </div>

      <div className="space-y-2.5 my-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="h-3 w-12 bg-[#262a33] rounded-[4px]" />
            <div className="h-2 flex-1 bg-[#262a33] rounded-full" />
            <div className="h-3 w-16 bg-[#262a33] rounded-[4px]" />
          </div>
        ))}
      </div>

      <div className="h-3 w-36 bg-[#262a33] rounded-[4px]" />
    </div>
  );
}
