import React, { useEffect, memo } from 'react';

/**
 * Reusable Mobile-First Bottom Sheet Component
 * - rounded-top 16px, bg #1a1d24, border-t #262a33
 * - drag handle at top, max-height 70vh, scrollable
 * - backdrop: 50% black, tap to close, ESC to close
 */
const BottomSheet = memo(function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Bottom sheet'}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[1px]"
    >
      {/* Tap backdrop to dismiss */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet card */}
      <div
        className="relative z-10 w-full max-w-[480px] bg-[#1a1d24] border-t border-[#262a33] rounded-t-[16px] max-h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-[#323742]" />
        </div>

        {/* Title row (optional) */}
        {title && (
          <div className="px-4 py-2 border-b border-[#262a33] flex items-center justify-between shrink-0">
            <h3 className="text-[15px] font-semibold text-[#e5e7eb] truncate">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-[#9ca3af] hover:text-[#e5e7eb] text-[13px] px-1 py-0.5 rounded-[4px] cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* Scrollable content body */}
        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
});

export default BottomSheet;
