import React from 'react';
import { RotateCcw, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DangerZoneSection({
  onRequestResetProperties,
  onRequestDeleteWorld,
  onRequestWipeAll,
}) {
  return (
    <div className="space-y-1 py-1">
      {/* 1. Reset All Settings */}
      <div
        onClick={onRequestResetProperties}
        className="min-h-[52px] p-2 rounded-[8px] hover:bg-[#ef4444]/10 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#ef4444]/15 flex items-center justify-center shrink-0">
            <RotateCcw size={18} className="text-[#ef4444]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-[#ef4444] truncate">
              Reset All Settings
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] truncate">
              Restore server.properties to factory defaults
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#ef4444]/60 shrink-0" />
      </div>

      {/* 2. Delete World */}
      <div
        onClick={onRequestDeleteWorld}
        className="min-h-[52px] p-2 rounded-[8px] hover:bg-[#ef4444]/10 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#ef4444]/15 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-[#ef4444]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-[#ef4444] truncate">
              Delete World
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] truncate">
              Permanently delete the current world
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#ef4444]/60 shrink-0" />
      </div>

      {/* 3. Wipe Everything */}
      <div
        onClick={onRequestWipeAll}
        className="min-h-[52px] p-2 rounded-[8px] hover:bg-[#ef4444]/10 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#ef4444]/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-[#ef4444]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-semibold text-[#ef4444] truncate">
              Wipe Everything
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] truncate">
              Delete world, plugins, and configs. Fresh start.
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[#ef4444]/60 shrink-0" />
      </div>
    </div>
  );
}
