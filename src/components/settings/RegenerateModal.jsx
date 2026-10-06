import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function RegenerateModal({
  isOpen,
  currentSeed = '',
  onClose,
  onRegenerate,
  isBusy = false,
}) {
  const [seedOption, setSeedOption] = useState('same'); // 'same' | 'random' | 'custom'
  const [customSeed, setCustomSeed] = useState('');
  const [backupFirst, setBackupFirst] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalSeed = currentSeed;
    if (seedOption === 'random') {
      finalSeed = String(Math.floor(Math.random() * 1e16));
    } else if (seedOption === 'custom') {
      finalSeed = customSeed.trim() || currentSeed;
    }
    onRegenerate(finalSeed, backupFirst);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
      <div
        className="w-full max-w-[340px] bg-[#1a1d24] border border-[#262a33] rounded-[12px] p-[16px] shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#262a33]">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-[#f97316]" />
            <h3 className="text-[15px] font-semibold text-[#e5e7eb]">
              Regenerate World
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
          <p className="text-[12px] text-[#9ca3af]">
            This will wipe the current world chunks and generate fresh terrain. Server will restart automatically.
          </p>

          <div className="space-y-2 text-[12.5px] bg-[#0f1115] p-3 rounded-[8px] border border-[#262a33]">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="seed_choice"
                checked={seedOption === 'same'}
                onChange={() => setSeedOption('same')}
                className="accent-[#f97316]"
              />
              <span className="text-[#e5e7eb]">Same seed (reset terrain)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="seed_choice"
                checked={seedOption === 'random'}
                onChange={() => setSeedOption('random')}
                className="accent-[#f97316]"
              />
              <span className="text-[#e5e7eb]">Random seed</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="seed_choice"
                checked={seedOption === 'custom'}
                onChange={() => setSeedOption('custom')}
                className="accent-[#f97316]"
              />
              <span className="text-[#e5e7eb]">Custom seed</span>
            </label>

            {seedOption === 'custom' && (
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Enter custom seed number or text"
                className="w-full h-[34px] px-2.5 rounded-[6px] bg-[#1a1d24] border border-[#262a33] text-[12px] font-mono text-[#e5e7eb] outline-none mt-1"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[#e5e7eb] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={backupFirst}
              onChange={(e) => setBackupFirst(e.target.checked)}
              className="rounded border-[#262a33] accent-[#4ade80]"
            />
            <span className="text-[#9ca3af]">Backup current world first</span>
          </label>

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
              className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold text-[13px] transition-colors duration-150"
            >
              {isBusy ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
