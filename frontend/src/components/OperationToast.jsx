import React from 'react';
import { Loader2 } from 'lucide-react';
import { useOperations } from '../lib/operations.js';

/**
 * Persistent progress toast that stays visible across all pages
 * while long-running operations (backup, restore) are in-flight.
 */
export default function OperationToast() {
  const { activeOp } = useOperations();

  if (!activeOp || !activeOp.isRunning) return null;

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none select-none">
      <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] bg-[#1a1d24] border border-[#fbbf24] shadow-2xl text-[13px] font-medium text-[#e5e7eb] max-w-[420px] w-full animate-in fade-in slide-in-from-bottom-2 duration-150">
        <Loader2 size={16} className="animate-spin text-[#fbbf24] shrink-0" />
        <span className="flex-1 truncate">
          {activeOp.label || 'Processing operation in background...'}
        </span>
        <span className="text-[11px] text-[#fbbf24] font-semibold bg-[#fbbf24]/10 px-2 py-0.5 rounded-[4px] shrink-0">
          In progress
        </span>
      </div>
    </div>
  );
}
