import React from 'react';
import { Trash2, AlertCircle, ShieldCheck } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';

export default function CleanupSheet({
  isOpen,
  onClose,
  onRequestBulkDelete,
}) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Clean Up Old Backups">
      <div className="space-y-4 select-none">
        <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-[12px]">
          <ShieldCheck size={16} className="shrink-0" />
          <span>Locked backups are safe and will never be deleted by cleanup.</span>
        </div>

        <div className="space-y-2">
          {/* Option 1: Keep only last 5 */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestBulkDelete('keep5', 'Keep only last 5 backups', 'All older unlocked backups will be permanently deleted.');
            }}
            className="w-full p-3 rounded-[8px] bg-[#0f1115] hover:bg-[#ef4444]/10 border border-[#262a33] hover:border-[#ef4444]/30 text-left transition-colors duration-150 cursor-pointer group"
          >
            <span className="text-[13.5px] font-semibold text-[#e5e7eb] group-hover:text-[#ef4444] block">
              Keep only last 5
            </span>
            <span className="text-[11.5px] text-[#9ca3af] block mt-0.5">
              Deletes all older unlocked backup archives to save storage space.
            </span>
          </button>

          {/* Option 2: Delete backups older than 30 days */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestBulkDelete('older30', 'Delete backups older than 30 days', 'All unlocked backups created over 30 days ago will be removed.');
            }}
            className="w-full p-3 rounded-[8px] bg-[#0f1115] hover:bg-[#ef4444]/10 border border-[#262a33] hover:border-[#ef4444]/30 text-left transition-colors duration-150 cursor-pointer group"
          >
            <span className="text-[13.5px] font-semibold text-[#e5e7eb] group-hover:text-[#ef4444] block">
              Delete backups older than 30 days
            </span>
            <span className="text-[11.5px] text-[#9ca3af] block mt-0.5">
              Removes obsolete legacy backups that are no longer needed.
            </span>
          </button>

          {/* Option 3: Delete all auto backups */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestBulkDelete('auto', 'Delete all auto backups', 'All automated snapshots will be removed. Manual and locked backups are kept.');
            }}
            className="w-full p-3 rounded-[8px] bg-[#0f1115] hover:bg-[#ef4444]/10 border border-[#262a33] hover:border-[#ef4444]/30 text-left transition-colors duration-150 cursor-pointer group"
          >
            <span className="text-[13.5px] font-semibold text-[#e5e7eb] group-hover:text-[#ef4444] block">
              Delete all auto backups
            </span>
            <span className="text-[11.5px] text-[#9ca3af] block mt-0.5">
              Only manually created and locked backups will be retained.
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
