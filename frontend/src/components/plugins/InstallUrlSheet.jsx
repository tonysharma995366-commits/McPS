import React, { useState } from 'react';
import { DownloadCloud, Link as LinkIcon, Loader2 } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import { api } from '../../lib/api.js';

export default function InstallUrlSheet({
  isOpen,
  onClose,
  onSuccessInstall,
  showToast,
}) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || isInstalling) return;

    setIsInstalling(true);
    try {
      await api.installPluginFromUrl(url.trim(), name.trim() || undefined);
      showToast?.('Plugin downloaded and installed', 'success');
      setUrl('');
      setName('');
      setIsInstalling(false);
      onClose();
      onSuccessInstall();
    } catch (err) {
      showToast?.(err.message || 'Failed to install plugin from URL', 'error');
      setIsInstalling(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Install from URL">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-medium text-[#9ca3af] mb-1">
            Direct .jar Download URL
          </label>
          <div className="relative flex items-center">
            <LinkIcon size={16} className="absolute left-3 text-[#6b7280] pointer-events-none" />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/plugins/my-plugin.jar"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full h-[40px] pl-9 pr-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] placeholder-[#6b7280] font-mono text-[12.5px] outline-none"
            />
          </div>
          <p className="text-[11px] text-[#6b7280] mt-1">
            Works with direct links from SpigotMC, Modrinth, or GitHub Releases.
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#9ca3af] mb-1">
            Plugin Name (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-detected from URL filename"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] placeholder-[#6b7280] text-[13px] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={isInstalling}
            onClick={onClose}
            className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] font-medium text-[13px] transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!url.trim() || isInstalling}
            className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-40 text-[#0f1115] font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors duration-150"
          >
            {isInstalling ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <DownloadCloud size={16} />
                <span>Download & Install</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
