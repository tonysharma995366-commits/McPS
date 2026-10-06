import React, { useState, useEffect, useRef } from 'react';
import { Archive, X } from 'lucide-react';

export default function CreateBackupModal({
  isOpen,
  defaultName = '',
  onClose,
  onCreate,
  isBusy = false,
}) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(name.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
      <div
        className="w-full max-w-[340px] bg-[#1a1d24] border border-[#262a33] rounded-[12px] p-[16px] shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#262a33]">
          <div className="flex items-center gap-2">
            <Archive size={18} className="text-[#4ade80]" />
            <h3 className="text-[15px] font-semibold text-[#e5e7eb]">
              Create World Backup?
            </h3>
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
          <p className="text-[12.5px] text-[#9ca3af] leading-relaxed">
            A full snapshot of the current world will be compressed and safely stored.
          </p>

          <div>
            <label className="block text-[11.5px] font-medium text-[#9ca3af] mb-1">
              Backup Name (Optional)
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pre-EnderDragon Fight"
              className="w-full h-[38px] px-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] text-[13px] outline-none"
            />
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
              disabled={isBusy}
              className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] font-semibold text-[13px] transition-colors duration-150 disabled:opacity-50"
            >
              {isBusy ? 'Starting...' : 'Create Backup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
