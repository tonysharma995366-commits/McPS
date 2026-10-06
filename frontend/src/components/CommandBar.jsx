import React, { useRef } from 'react';
import { Send, Loader2, History } from 'lucide-react';

/**
 * Command Input Bar (height 56px container)
 * Left: input field (flex-1, height 40px)
 * Middle: history button (32x32 ghost)
 * Right: send button (40x40 green)
 */
export default function CommandBar({
  value,
  onChange,
  onSend,
  isSending = false,
  onOpenHistory,
  historyCount = 0,
  inputRef,
}) {
  const localInputRef = useRef(null);
  const activeInputRef = inputRef || localInputRef;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || isSending) return;
    onSend(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isBlank = !value.trim();

  return (
    <div className="h-[56px] px-3 bg-[#0f1115] border-t border-[#262a33] flex items-center gap-2">
      <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
        {/* Command text input */}
        <div className="relative flex-1 flex items-center">
          <input
            ref={activeInputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            enterKeyHint="send"
            aria-label="Server command"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full h-[40px] px-3 rounded-[8px] bg-[#1a1d24] border border-[#262a33] focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] text-[#e5e7eb] placeholder-[#6b7280] font-mono text-[13px] outline-none transition-colors duration-150"
          />
        </div>

        {/* History Toggle Button (32x32 ghost) */}
        <button
          type="button"
          onClick={onOpenHistory}
          disabled={historyCount === 0}
          title="Command history"
          className="w-[32px] h-[32px] rounded-[6px] flex items-center justify-center text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1a1d24] disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-150 shrink-0 cursor-pointer"
        >
          <History size={18} />
        </button>

        {/* Send Button (40x40 green) */}
        <button
          type="submit"
          disabled={isBlank || isSending}
          aria-label="Send command"
          className="w-[40px] h-[40px] rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-40 disabled:hover:bg-[#4ade80] flex items-center justify-center text-[#0f1115] transition-all duration-150 shrink-0 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <Loader2 size={18} className="animate-spin text-[#0f1115]" />
          ) : (
            <Send size={18} className="translate-x-[1px]" />
          )}
        </button>
      </form>
    </div>
  );
}
