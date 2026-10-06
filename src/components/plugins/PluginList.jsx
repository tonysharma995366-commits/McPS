import React from 'react';
import { Puzzle, SearchX } from 'lucide-react';
import PluginRow from './PluginRow.jsx';
import SkeletonCard from '../SkeletonCard.jsx';

/**
 * Scrollable list of plugins with empty/loading state handling
 */
export default function PluginList({
  plugins = [],
  isLoading = false,
  searchQuery = '',
  onClearSearch,
  onOpenDetails,
  onToggleEnabled,
}) {
  if (isLoading && plugins.length === 0) {
    return (
      <div className="space-y-2">
        <SkeletonCard rows={2} height="h-20" />
        <SkeletonCard rows={2} height="h-20" />
        <SkeletonCard rows={2} height="h-20" />
      </div>
    );
  }

  // Empty Search Results
  if (plugins.length === 0 && searchQuery) {
    return (
      <div className="rounded-[12px] p-8 bg-[#1a1d24] border border-[#262a33] flex flex-col items-center justify-center text-center select-none">
        <SearchX size={32} className="text-[#6b7280] mb-2" />
        <h4 className="text-[14px] font-semibold text-[#e5e7eb] mb-1">
          No plugins match &quot;{searchQuery}&quot;
        </h4>
        <button
          type="button"
          onClick={onClearSearch}
          className="text-[12px] text-[#4ade80] hover:underline mt-1 cursor-pointer"
        >
          Clear search
        </button>
      </div>
    );
  }

  // Zero Plugins Installed
  if (plugins.length === 0) {
    return (
      <div className="rounded-[12px] p-8 bg-[#1a1d24] border border-[#262a33] flex flex-col items-center justify-center text-center select-none">
        <Puzzle size={32} className="text-[#6b7280] mb-2" />
        <h4 className="text-[14px] font-semibold text-[#e5e7eb] mb-0.5">
          No plugins installed
        </h4>
        <p className="text-[12px] text-[#6b7280]">
          Tap + to upload a .jar file or browse store
        </p>
      </div>
    );
  }

  return (
    <div className={plugins.length > 30 ? '[content-visibility:auto]' : ''}>
      {plugins.map((plugin) => (
        <PluginRow
          key={plugin.id || plugin.name}
          plugin={plugin}
          onOpenDetails={onOpenDetails}
          onToggleEnabled={onToggleEnabled}
        />
      ))}
    </div>
  );
}
