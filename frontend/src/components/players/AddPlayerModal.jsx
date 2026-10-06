import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, X } from 'lucide-react';

/**
 * Small modal for adding a player to whitelist or operators
 */
export default function AddPlayerModal({
  isOpen,
  onClose,
  onAdd,
  title = 'Add to Whitelist',
  buttonText = 'Add Player',
  isBusy = false,
}) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || isBusy) return;
    onAdd(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
      <div
        className="w-full max-w-[360px] bg-[#1a1d24] border border-[#262a33] rounded-[12px] p-[16px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#262a33]">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-[#4ade80]" />
            <h3 className="text-[15px] font-semibold text-[#e5e7eb]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#e5e7eb] p-1 rounded-[4px]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-[#9ca3af] mb-1">
              Player Username
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PlayerName"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] placeholder-[#6b7280] font-mono text-[13px] outline-none"
            />
            <p className="text-[11px] text-[#6b7280] mt-1">
              UUID will be verified automatically by the server.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={onClose}
              className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] font-medium text-[13px] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isBusy}
              className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-40 text-[#0f1115] font-semibold text-[13px] transition-colors duration-150"
            >
              {isBusy ? 'Adding...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
