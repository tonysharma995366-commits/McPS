import React from 'react';
import { ArrowUpDown } from 'lucide-react';

const SORT_LABELS = {
  newest: 'Newest',
  oldest: 'Oldest',
  largest: 'Largest',
};

const SORT_ORDER = ['newest', 'oldest', 'largest'];

export default function SortChip({ currentSort = 'newest', onCycleSort }) {
  const handleClick = () => {
    const currentIndex = SORT_ORDER.indexOf(currentSort);
    const nextSort = SORT_ORDER[(currentIndex + 1) % SORT_ORDER.length];
    onCycleSort(nextSort);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="h-[28px] px-2.5 rounded-full bg-[#1a1d24] hover:bg-[#262a33] border border-[#262a33] text-[11.5px] font-medium text-[#9ca3af] hover:text-[#e5e7eb] flex items-center gap-1.5 transition-colors duration-150 cursor-pointer select-none"
      title="Click to cycle sort order"
    >
      <ArrowUpDown size={12} className="text-[#6b7280]" />
      <span>{SORT_LABELS[currentSort] || 'Newest'}</span>
    </button>
  );
}
