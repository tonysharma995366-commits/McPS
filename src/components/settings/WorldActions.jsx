import React, { useState, useRef } from 'react';
import {
  Archive,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '../../lib/api.js';

export default function WorldActions({
  onBackupNow,
  isBackingUp = false,
  onRequestUpload,
  onRequestRegenerate,
  showToast,
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Trigger world download
  const handleDownload = () => {
    showToast?.('Preparing world .zip for download...', 'success');
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      window.location.href = api.getDownloadWorldUrl();
    }, 1000);
  };

  return (
    <div className="space-y-1.5 py-1">
      {/* 1. Backup Now */}
      <div
        onClick={isBackingUp ? undefined : onBackupNow}
        className="min-h-[52px] p-2 rounded-[8px] hover:bg-[#262a33]/50 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 select-none relative overflow-hidden"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#4ade80]/15 flex items-center justify-center shrink-0">
            {isBackingUp ? (
              <Loader2 size={18} className="animate-spin text-[#4ade80]" />
            ) : (
              <Archive size={18} className="text-[#4ade80]" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-[#e5e7eb] truncate">
              Backup Now
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] truncate">
              Create a snapshot of the world
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#6b7280] shrink-0" />

        {/* Inline thin progress bar while backup is running */}
        {isBackingUp && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4ade80] animate-pulse" />
        )}
      </div>

      {/* 2. Download World */}
      <div
        onClick={isDownloading ? undefined : handleDownload}
        className="min-h-[52px] p-2 rounded-[8px] hover:bg-[#262a33]/50 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#60a5fa]/15 flex items-center justify-center shrink-0">
            {isDownloading ? (
              <Loader2 size={18} className="animate-spin text-[#60a5fa]" />
            ) : (
              <Download size={18} className="text-[#60a5fa]" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-[#e5e7eb] truncate">
              Download World
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] truncate">
              Download world as .zip archive
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#6b7280] shrink-0" />
      </div>

      {/* 3. Upload / Replace World */}
      <div
        onClick={onRequestUpload}
        className="min-h-[52px] p-2 rounded-[8px] hover:bg-[#262a33]/50 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#fbbf24]/15 flex items-center justify-center shrink-0">
            <Upload size={18} className="text-[#fbbf24]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-[#e5e7eb] truncate">
              Upload / Replace World
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] truncate">
              Replace current world with a .zip
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#6b7280] shrink-0" />
      </div>

      {/* 4. Regenerate World */}
      <div
        onClick={onRequestRegenerate}
        className="min-h-[52px] p-2 rounded-[8px] hover:bg-[#262a33]/50 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#f97316]/15 flex items-center justify-center shrink-0">
            <RefreshCw size={18} className="text-[#f97316]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-[#e5e7eb] truncate">
              Regenerate World
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] truncate">
              Generate a fresh world with a new seed
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#6b7280] shrink-0" />
      </div>
    </div>
  );
}
