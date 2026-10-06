import React from 'react';
import { Save, RotateCcw, Eye, Loader2 } from 'lucide-react';

/**
 * Sticky Save Bar pinned directly above bottom navigation bar
 * Displays dirty counts, diff preview button, reset button, and save button.
 */
export default function SaveBar({
  dirtyCount,
  onOpenDiff,
  onReset,
  onSave,
  isSaving = false,
  hasErrors = false,
}) {
  if (dirtyCount <= 0) return null;

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-[480px] mx-auto px-3 pb-2">
        <div className="pointer-events-auto h-[54px] px-3.5 rounded-[12px] bg-[#14171d]/95 backdrop-blur-[8px] border border-[#262a33] shadow-2xl flex items-center justify-between gap-2">
          {/* Left info: N unsaved changes */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse shrink-0" />
            <span className="text-[12px] font-medium text-[#e5e7eb] truncate">
              <span className="font-mono text-[#fbbf24] font-semibold">{dirtyCount}</span> unsaved {dirtyCount === 1 ? 'change' : 'changes'}
            </span>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Diff Button */}
            <button
              type="button"
              onClick={onOpenDiff}
              className="h-[34px] px-2.5 rounded-[6px] text-[11.5px] font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#262a33] transition-colors flex items-center gap-1 cursor-pointer"
              title="View changed properties"
            >
              <Eye size={13} />
              <span className="hidden xs:inline">Diff</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="h-[34px] px-2.5 rounded-[6px] text-[11.5px] font-medium text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
              title="Reset unsaved changes"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || hasErrors}
              className="h-[34px] px-3 rounded-[6px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
