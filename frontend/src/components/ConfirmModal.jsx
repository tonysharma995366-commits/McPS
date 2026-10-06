import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Centered confirmation modal for destructive operations
 * Supports requireText (case-sensitive typed confirmation) and requireCheckbox
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  variant, // alias for confirmVariant
  requireText,
  requireCheckbox,
  onConfirm,
  onCancel,
  isBusy = false,
}) {
  const [typedText, setTypedText] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTypedText('');
      setIsChecked(false);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isBusy && onCancel) {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isBusy, onCancel]);

  if (!isOpen) return null;

  const actualVariant = variant || confirmVariant;
  const isDanger = actualVariant === 'danger';
  const isWarning = actualVariant === 'warning';

  const textValid = !requireText || typedText === requireText;
  const checkboxValid = !requireCheckbox || isChecked;
  const canConfirm = textValid && checkboxValid && !isBusy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-[340px] bg-[#1a1d24] border border-[#262a33] rounded-[12px] p-[16px] shadow-2xl select-none">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className={`p-2 rounded-[8px] ${
              isDanger
                ? 'bg-[#ef4444]/15 text-[#ef4444]'
                : isWarning
                ? 'bg-[#fbbf24]/15 text-[#fbbf24]'
                : 'bg-[#4ade80]/15 text-[#4ade80]'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-[15px] font-semibold text-[#e5e7eb] leading-snug">
            {title}
          </h3>
        </div>

        <p className="text-[12.5px] text-[#9ca3af] leading-relaxed mb-3">
          {message}
        </p>

        {/* Typed confirmation input if required */}
        {requireText && (
          <div className="mb-3">
            <label className="block text-[11.5px] text-[#9ca3af] mb-1">
              Type <span className="font-mono font-bold text-[#ef4444] select-all">{requireText}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requireText}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full h-[36px] px-2.5 rounded-[6px] bg-[#0f1115] border border-[#262a33] focus:border-[#ef4444] text-[#e5e7eb] font-mono text-[12.5px] outline-none"
            />
          </div>
        )}

        {/* Checkbox confirmation if required */}
        {requireCheckbox && (
          <label className="flex items-start gap-2 mb-4 text-[12px] text-[#e5e7eb] cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 rounded border-[#262a33] text-[#ef4444] accent-[#ef4444]"
            />
            <span className="leading-tight text-[#9ca3af] select-none">{requireCheckbox}</span>
          </label>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] font-medium text-[13px] transition-colors duration-150 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className={`
              flex-1 min-h-[44px] px-3 rounded-[8px] font-medium text-[13px] text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
              ${
                isDanger
                  ? 'bg-[#ef4444] hover:bg-[#dc2626]'
                  : isWarning
                  ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#0f1115]'
                  : 'bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115]'
              }
            `}
          >
            {isBusy ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
