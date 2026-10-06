import React, { useRef } from 'react';

const CHIPS = [
  { id: 'ALL', label: 'All' },
  { id: 'INFO', label: 'Info' },
  { id: 'WARN', label: 'Warn' },
  { id: 'ERROR', label: 'Error' },
  { id: 'CHAT', label: 'Chat' },
];

/**
 * Filter Chips Row (sticky under TopBar)
 * Height: 44px container, 28px chips, no wrap, hidden scrollbar
 * Debounced filter changes by 50ms for weak mobile CPU
 */
export default function FilterChips({ activeFilter, onSelectFilter }) {
  const debounceTimerRef = useRef(null);

  const handleClick = (chipId) => {
    if (chipId === activeFilter) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSelectFilter(chipId);
    }, 50);
  };

  return (
    <div className="h-[44px] flex items-center px-3 bg-[#0f1115] border-b border-[#262a33] overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-2 shrink-0">
        {CHIPS.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleClick(chip.id)}
              className={`
                h-[28px] rounded-full px-3 text-[12px] font-medium whitespace-nowrap
                transition-all duration-150 cursor-pointer select-none
                ${
                  isActive
                    ? 'bg-[#4ade80]/10 border border-[#4ade80] text-[#4ade80]'
                    : 'bg-[#1a1d24] border border-[#262a33] text-[#9ca3af] hover:text-[#e5e7eb] hover:border-[#323742]'
                }
              `}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
