import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Collapsible Category Section container with match badge and modified indicator.
 */
const CategorySection = memo(function CategorySection({
  category,
  isOpen,
  onToggle,
  children,
  matchCount,
  isSearching,
  hasModifiedProperties,
}) {
  return (
    <div className="rounded-[12px] bg-[#1a1d24] border border-[#262a33] overflow-hidden select-none mb-3 shadow-sm transition-all duration-150">
      {/* 48px Header Row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full h-[48px] px-3.5 flex items-center justify-between hover:bg-[#262a33]/40 transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {hasModifiedProperties && (
            <span
              className="w-2 h-2 rounded-full bg-[#f97316] shrink-0"
              title="Contains modified properties"
            />
          )}

          <span className="text-[14px] font-semibold text-[#e5e7eb] truncate">
            {category.title}
          </span>

          {/* Count Badge */}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#262a33] text-[#9ca3af]">
            {isSearching ? `${matchCount} match${matchCount !== 1 ? 'es' : ''}` : category.keys.length}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[#9ca3af] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Children content area */}
      {isOpen && (
        <div className="px-3.5 pb-2 pt-0.5 border-t border-[#262a33] bg-[#1a1d24]/70">
          {children}
        </div>
      )}
    </div>
  );
});

export default CategorySection;
