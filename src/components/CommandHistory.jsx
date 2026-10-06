import React from 'react';
import { History, X } from 'lucide-react';

/**
 * Command History Bottom Sheet
 * Displays up to 20 past commands in memory.
 */
export default function CommandHistory({ isOpen, onClose, history = [], onSelectCommand }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[1px]">
      <div
        className="w-full max-w-[480px] bg-[#1a1d24] border-t border-[#262a33] rounded-t-[16px] p-4 shadow-2xl max-h-[60vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#262a33] mb-2">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#4ade80]" />
            <h3 className="text-[14px] font-semibold text-[#e5e7eb]">Command History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9ca3af] hover:text-[#e5e7eb] rounded-[6px]"
            aria-label="Close command history"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 py-1">
          {history.length === 0 ? (
            <div className="text-center py-6 text-[13px] text-[#6b7280]">
              No past commands yet
            </div>
          ) : (
            history.map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectCommand(cmd);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-[8px] bg-[#0f1115] hover:bg-[#262a33] border border-[#262a33] text-[13px] font-mono text-[#e5e7eb] truncate transition-colors duration-150 cursor-pointer active:scale-[0.99]"
              >
                {cmd}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
