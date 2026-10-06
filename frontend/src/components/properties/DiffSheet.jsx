import React from 'react';
import { Save, AlertTriangle, Zap } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import { RESTART_REQUIRED_KEYS, LIVE_APPLYABLE_KEYS } from '../../lib/propertyMeta.js';

/**
 * BottomSheet displaying side-by-side diff of pending property modifications
 */
export default function DiffSheet({
  isOpen,
  onClose,
  diffList = [],
  onConfirmSave,
  isSaving = false,
}) {
  const restartCount = diffList.filter((d) => RESTART_REQUIRED_KEYS.has(d.key)).length;
  const liveCount = diffList.filter((d) => LIVE_APPLYABLE_KEYS.has(d.key)).length;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pending Changes Diff">
      <div className="space-y-3 pb-2 select-none">
        {/* Summary badges */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {restartCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30 font-medium">
              <AlertTriangle size={12} />
              {restartCount} will require restart
            </span>
          )}
          {liveCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 font-medium">
              <Zap size={12} />
              {liveCount} apply live via RCON
            </span>
          )}
        </div>

        {/* Diff List */}
        <div className="rounded-[8px] bg-[#0f1115] border border-[#262a33] divide-y divide-[#262a33]/60 max-h-[46vh] overflow-y-auto">
          {diffList.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-[#9ca3af]">
              No differences detected
            </div>
          ) : (
            diffList.map((item) => {
              const needsRestart = RESTART_REQUIRED_KEYS.has(item.key);
              return (
                <div key={item.key} className="p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-mono text-[#e5e7eb] font-semibold truncate">
                      {item.key}
                    </span>
                    {needsRestart ? (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-[4px] bg-[#262a33] text-[#fbbf24] font-mono">
                        restart
                      </span>
                    ) : (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-[4px] bg-[#262a33] text-[#4ade80] font-mono">
                        live
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11.5px] flex-wrap">
                    {/* Old value with strike-through in red */}
                    <span className="line-through text-[#ef4444] bg-[#ef4444]/10 px-1.5 py-0.5 rounded-[4px] truncate max-w-[180px]">
                      {item.oldValue === '' ? '(empty)' : item.oldValue}
                    </span>
                    <span className="text-[#6b7280]">→</span>
                    {/* New value in green */}
                    <span className="text-[#4ade80] font-semibold bg-[#4ade80]/10 px-1.5 py-0.5 rounded-[4px] truncate max-w-[180px]">
                      {item.newValue === '' ? '(empty)' : item.newValue}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[42px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] font-medium text-[13px] transition-colors cursor-pointer"
          >
            Keep Editing
          </button>
          <button
            type="button"
            disabled={diffList.length === 0 || isSaving}
            onClick={() => {
              onClose();
              onConfirmSave();
            }}
            className="flex-1 min-h-[42px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Save size={15} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
