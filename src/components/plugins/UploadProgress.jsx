import React from 'react';
import { FileCode2, Loader2 } from 'lucide-react';

export default function UploadProgress({ filename, progress = 0 }) {
  return (
    <div className="p-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] space-y-2 select-none">
      <div className="flex items-center justify-between text-[12.5px]">
        <div className="flex items-center gap-2 truncate">
          <FileCode2 size={16} className="text-[#4ade80] shrink-0" />
          <span className="font-mono text-[#e5e7eb] truncate">{filename}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-[#4ade80] font-mono font-medium">
          <Loader2 size={13} className="animate-spin" />
          <span>{progress}%</span>
        </div>
      </div>

      <div className="h-[6px] rounded-full bg-[#262a33] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#4ade80] transition-all duration-150 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
