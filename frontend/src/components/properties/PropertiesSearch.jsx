import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Sticky search bar and Form/Raw mode segmented control
 * Height: 56px, px-3, flex gap-2
 */
export default function PropertiesSearch({
  searchQuery,
  onSearchChange,
  activeMode,
  onModeChange,
  matchCount,
  totalCount,
}) {
  return (
    <div className="sticky top-[52px] z-20 bg-[#0f1115]/95 backdrop-blur-[4px] border-b border-[#262a33] -mx-3 px-3 py-2.5">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search properties..."
            spellCheck={false}
            autoCorrect="off"
            className="w-full h-[36px] pl-8 pr-8 rounded-[8px] bg-[#1a1d24] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] placeholder-[#6b7280] text-[13px] outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#9ca3af] hover:text-[#e5e7eb] rounded-full hover:bg-[#262a33]/60 cursor-pointer"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 2-Segment Control: Form vs Raw */}
        <div className="w-[124px] h-[36px] shrink-0 p-1 rounded-[8px] bg-[#1a1d24] border border-[#262a33] flex items-center">
          <button
            type="button"
            onClick={() => onModeChange('form')}
            className={`flex-1 h-full rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer flex items-center justify-center ${
              activeMode === 'form'
                ? 'bg-[#262a33] text-[#e5e7eb] font-semibold shadow-xs'
                : 'text-[#9ca3af] hover:text-[#e5e7eb]'
            }`}
          >
            Form
          </button>
          <button
            type="button"
            onClick={() => onModeChange('raw')}
            className={`flex-1 h-full rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer flex items-center justify-center ${
              activeMode === 'raw'
                ? 'bg-[#262a33] text-[#e5e7eb] font-semibold shadow-xs'
                : 'text-[#9ca3af] hover:text-[#e5e7eb]'
            }`}
          >
            Raw
          </button>
        </div>
      </div>

      {/* Match Count Chip when searching or in form mode */}
      {searchQuery && activeMode === 'form' && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] px-0.5">
          <span className="text-[#9ca3af]">
            <span className="text-[#4ade80] font-mono font-medium">{matchCount}</span> of{' '}
            <span className="font-mono">{totalCount}</span> properties match
          </span>
          {matchCount === 0 && (
            <span className="text-[#ef4444] font-medium">No results</span>
          )}
        </div>
      )}
    </div>
  );
}
