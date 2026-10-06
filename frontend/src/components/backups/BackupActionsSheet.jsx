import React from 'react';
import {
  RotateCcw,
  Download,
  Pencil,
  Copy,
  Lock,
  Unlock,
  Trash2,
  X,
  Archive,
} from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import { timeAgo } from '../../lib/format.js';

export default function BackupActionsSheet({
  backup,
  isOpen,
  onClose,
  onRequestRestore,
  onDownload,
  onRequestRename,
  onDuplicate,
  onToggleLock,
  onRequestDelete,
}) {
  if (!backup) return null;

  const timeFormatted = backup.createdAt ? timeAgo(backup.createdAt) : 'Recently';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 select-none">
        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262a33]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[8px] bg-[#262a33] flex items-center justify-center shrink-0">
              <Archive size={20} className="text-[#4ade80]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-[#e5e7eb] truncate">
                {backup.name}
              </h3>
              <p className="text-[12px] text-[#9ca3af] truncate mt-0.5">
                {backup.size || '248 MB'} · {timeFormatted}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9ca3af] hover:text-[#e5e7eb] rounded-[6px] shrink-0"
            aria-label="Close action sheet"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action List */}
        <div className="space-y-1">
          {/* 1. Restore This Backup */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestRestore(backup);
            }}
            className="w-full min-h-[48px] p-2.5 rounded-[8px] flex items-center gap-3 text-left hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#4ade80]/15 flex items-center justify-center shrink-0 text-[#4ade80]">
              <RotateCcw size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13.5px] font-semibold text-[#e5e7eb] block">
                Restore This Backup
              </span>
              <span className="text-[11.5px] text-[#9ca3af] block">
                Replace current world with this backup
              </span>
            </div>
          </button>

          {/* 2. Download */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onDownload(backup);
            }}
            className="w-full min-h-[44px] p-2 rounded-[8px] flex items-center gap-3 text-left hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#60a5fa]/15 flex items-center justify-center shrink-0 text-[#60a5fa]">
              <Download size={16} />
            </div>
            <span className="text-[13.5px] font-medium text-[#e5e7eb]">
              Download Archive (.zip)
            </span>
          </button>

          {/* 3. Rename */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestRename(backup);
            }}
            className="w-full min-h-[44px] p-2 rounded-[8px] flex items-center gap-3 text-left hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#262a33] flex items-center justify-center shrink-0 text-[#9ca3af]">
              <Pencil size={16} />
            </div>
            <span className="text-[13.5px] font-medium text-[#e5e7eb]">
              Rename Backup
            </span>
          </button>

          {/* 4. Duplicate */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onDuplicate(backup);
            }}
            className="w-full min-h-[44px] p-2 rounded-[8px] flex items-center gap-3 text-left hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#262a33] flex items-center justify-center shrink-0 text-[#9ca3af]">
              <Copy size={16} />
            </div>
            <span className="text-[13.5px] font-medium text-[#e5e7eb]">
              Duplicate Backup
            </span>
          </button>

          {/* 5. Lock / Unlock */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleLock(backup);
            }}
            className="w-full min-h-[44px] p-2 rounded-[8px] flex items-center gap-3 text-left hover:bg-[#262a33] transition-colors duration-150 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#fbbf24]/15 flex items-center justify-center shrink-0 text-[#fbbf24]">
              {backup.locked ? <Unlock size={16} /> : <Lock size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13.5px] font-medium text-[#e5e7eb] block">
                {backup.locked ? 'Unlock Backup' : 'Lock Backup'}
              </span>
              <span className="text-[11px] text-[#9ca3af] block">
                {backup.locked ? 'Allow auto-cleanup to delete' : 'Protect from auto-cleanup deletion'}
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="border-t border-[#262a33] my-1" />

          {/* 6. Delete */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestDelete(backup);
            }}
            className="w-full min-h-[44px] p-2 rounded-[8px] flex items-center gap-3 text-left hover:bg-[#ef4444]/10 transition-colors duration-150 cursor-pointer text-[#ef4444]"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#ef4444]/15 flex items-center justify-center shrink-0 text-[#ef4444]">
              <Trash2 size={16} />
            </div>
            <span className="text-[13.5px] font-medium text-[#ef4444]">
              Delete Backup
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
