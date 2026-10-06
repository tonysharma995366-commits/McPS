import React from 'react';
import {
  FileDown,
  Trash2,
  Eraser,
  RefreshCw,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import CollapsibleSection from '../settings/CollapsibleSection.jsx';

/**
 * Maintenance Actions Card providing log downloading, cache purging,
 * container rebooting, and emergency force stop.
 */
export default function MaintenanceCard({
  isOpen = false,
  onToggle,
  onDownloadLogs,
  onRequestClearLogs,
  onRequestClearCache,
  onRequestRestartContainer,
  onRequestForceKill,
}) {
  return (
    <CollapsibleSection
      title="Maintenance"
      isOpen={isOpen}
      onToggle={onToggle}
      danger={false}
    >
      <div className="divide-y divide-[#262a33]/60 pt-0.5">
        {/* 1. Download Full Logs */}
        <button
          type="button"
          onClick={onDownloadLogs}
          className="w-full py-2.5 flex items-center justify-between text-left hover:bg-[#262a33]/30 px-1 rounded-[6px] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#3b82f6]/15 text-[#3b82f6] flex items-center justify-center shrink-0">
              <FileDown size={16} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#e5e7eb] group-hover:text-white">
                Download Full Logs
              </p>
              <p className="text-[11px] text-[#9ca3af]">
                Download complete server.log file
              </p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#6b7280] group-hover:text-[#e5e7eb]" />
        </button>

        {/* 2. Clear Logs */}
        <button
          type="button"
          onClick={onRequestClearLogs}
          className="w-full py-2.5 flex items-center justify-between text-left hover:bg-[#262a33]/30 px-1 rounded-[6px] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#fbbf24]/15 text-[#fbbf24] flex items-center justify-center shrink-0">
              <Trash2 size={16} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#e5e7eb] group-hover:text-white">
                Clear Logs
              </p>
              <p className="text-[11px] text-[#9ca3af]">
                Truncate server.log to free disk space
              </p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#6b7280] group-hover:text-[#e5e7eb]" />
        </button>

        {/* 3. Clear Cache */}
        <button
          type="button"
          onClick={onRequestClearCache}
          className="w-full py-2.5 flex items-center justify-between text-left hover:bg-[#262a33]/30 px-1 rounded-[6px] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#f97316]/15 text-[#f97316] flex items-center justify-center shrink-0">
              <Eraser size={16} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#e5e7eb] group-hover:text-white">
                Clear Cache
              </p>
              <p className="text-[11px] text-[#9ca3af]">
                Delete temporary chunk and entity caches
              </p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#6b7280] group-hover:text-[#e5e7eb]" />
        </button>

        {/* 4. Restart Container */}
        <button
          type="button"
          onClick={onRequestRestartContainer}
          className="w-full py-2.5 flex items-center justify-between text-left hover:bg-[#ef4444]/10 px-1 rounded-[6px] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#ef4444]/15 text-[#ef4444] flex items-center justify-center shrink-0">
              <RefreshCw size={16} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#ef4444] group-hover:text-[#f87171]">
                Restart Container
              </p>
              <p className="text-[11px] text-[#9ca3af]">
                Full restart of the Railway cloud container (~60s downtime)
              </p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#6b7280] group-hover:text-[#ef4444]" />
        </button>

        {/* 5. Force Stop Server (kill) */}
        <button
          type="button"
          onClick={onRequestForceKill}
          className="w-full py-2.5 flex items-center justify-between text-left hover:bg-[#ef4444]/10 px-1 rounded-[6px] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center shrink-0">
              <AlertOctagon size={16} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#ef4444] group-hover:text-[#f87171]">
                Force Stop Server (kill)
              </p>
              <p className="text-[11px] text-[#9ca3af]">
                Forcefully terminate Java process (SIGKILL)
              </p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#6b7280] group-hover:text-[#ef4444]" />
        </button>
      </div>
    </CollapsibleSection>
  );
}
