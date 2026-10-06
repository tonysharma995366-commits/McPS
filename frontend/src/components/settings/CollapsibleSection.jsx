import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Collapsible Section wrapper with 48px header and 150ms smooth toggle.
 * Unmounts children when closed to preserve memory on weak devices.
 */
const CollapsibleSection = memo(function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  danger = false,
  badge = null,
}) {
  return (
    <div className="rounded-[12px] bg-[#1a1d24] border border-[#262a33] overflow-hidden select-none mb-3 shadow-sm">
      {/* 48px Header row */}
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full h-[48px] px-3.5 flex items-center justify-between transition-colors duration-150 cursor-pointer
          ${danger ? 'hover:bg-[#ef4444]/5' : 'hover:bg-[#262a33]/40'}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className={`text-[14px] font-semibold truncate ${
              danger ? 'text-[#ef4444]' : 'text-[#e5e7eb]'
            }`}
          >
            {title}
          </span>
          {badge}
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-150 ${
            danger ? 'text-[#ef4444]' : 'text-[#9ca3af]'
          } ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {/* Content area: unmounted when closed */}
      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#262a33]">
          {children}
        </div>
      )}
    </div>
  );
});

export default CollapsibleSection;
