import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Global Toast Component with support for up to 3 stacked toasts.
 * Auto-dismisses each toast after 2.5s. Older toasts push up and fade out.
 */
export default function Toast({ toast, toasts = [], onDismiss }) {
  // Normalize into array
  const items = toasts.length > 0 ? toasts : toast ? [toast] : [];

  useEffect(() => {
    if (items.length === 0) return;

    const timer = setTimeout(() => {
      const oldest = items[0];
      if (oldest && onDismiss) {
        onDismiss(oldest.id);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [items, onDismiss]);

  if (items.length === 0) return null;

  // Show at most 3 latest toasts
  const visibleToasts = items.slice(-3);

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-50 flex flex-col items-center gap-1.5 px-4 pointer-events-none select-none">
      {visibleToasts.map((item) => {
        const isSuccess = item.type !== 'error' && item.type !== 'danger';
        const isWarning = item.type === 'warning';

        return (
          <div
            key={item.id || item.message}
            className={`
              pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px]
              bg-[#1a1d24]/95 backdrop-blur-[6px] border shadow-2xl text-[13px] font-medium
              transition-all duration-150 max-w-[420px] w-full animate-in fade-in slide-in-from-bottom-2 duration-150
              ${
                isSuccess
                  ? 'border-[#4ade80]/60 text-[#e5e7eb]'
                  : isWarning
                  ? 'border-[#fbbf24]/60 text-[#e5e7eb]'
                  : 'border-[#ef4444]/60 text-[#e5e7eb]'
              }
            `}
          >
            {isSuccess ? (
              <CheckCircle2 size={16} className="text-[#4ade80] shrink-0" />
            ) : isWarning ? (
              <AlertCircle size={16} className="text-[#fbbf24] shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-[#ef4444] shrink-0" />
            )}
            <span className="flex-1 truncate">{item.message}</span>
            <button
              onClick={() => onDismiss && onDismiss(item.id)}
              className="text-[#9ca3af] hover:text-[#e5e7eb] p-1 -mr-1 transition-colors duration-150 cursor-pointer"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
