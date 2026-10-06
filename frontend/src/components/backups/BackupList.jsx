import React from 'react';
import { Archive, Trash2 } from 'lucide-react';
import BackupRow from './BackupRow.jsx';
import SortChip from './SortChip.jsx';
import SkeletonCard from '../SkeletonCard.jsx';

export default function BackupList({
  backups = [],
  isLoading = false,
  currentSort = 'newest',
  onCycleSort,
  onOpenActions,
  onOpenCleanup,
  onRequestCreate,
}) {
  if (isLoading && backups.length === 0) {
    return (
      <div className="space-y-2 mt-2">
        <SkeletonCard rows={2} height="h-20" />
        <SkeletonCard rows={2} height="h-20" />
        <SkeletonCard rows={2} height="h-20" />
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5 px-0.5 select-none">
        <h3 className="text-[14px] font-semibold text-[#e5e7eb]">
          Backups ({backups.length})
        </h3>

        <div className="flex items-center gap-1.5">
          {backups.length > 0 && (
            <button
              type="button"
              onClick={onOpenCleanup}
              className="h-[28px] px-2.5 rounded-full bg-[#1a1d24] hover:bg-[#ef4444]/15 border border-[#262a33] text-[11.5px] font-medium text-[#9ca3af] hover:text-[#ef4444] flex items-center gap-1 transition-colors duration-150 cursor-pointer"
              title="Delete old backups"
            >
              <Trash2 size={12} />
              <span>Cleanup</span>
            </button>
          )}

          <SortChip currentSort={currentSort} onCycleSort={onCycleSort} />
        </div>
      </div>

      {/* Empty State */}
      {backups.length === 0 ? (
        <div className="rounded-[12px] p-8 bg-[#1a1d24] border border-[#262a33] flex flex-col items-center justify-center text-center select-none">
          <Archive size={32} className="text-[#6b7280] mb-2" />
          <h4 className="text-[14px] font-semibold text-[#e5e7eb] mb-0.5">
            No backups yet
          </h4>
          <p className="text-[12px] text-[#6b7280] mb-3">
            Create your first backup to protect your world
          </p>
          <button
            type="button"
            onClick={onRequestCreate}
            className="px-3.5 py-2 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#4ade80] text-[13px] font-semibold transition-colors duration-150 cursor-pointer"
          >
            Create Backup
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <BackupRow
              key={backup.id}
              backup={backup}
              onOpenActions={onOpenActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
