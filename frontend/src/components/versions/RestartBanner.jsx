import React, { useState } from "react";
import { AlertTriangle, RotateCw, Loader2 } from "lucide-react";
import { api } from "../../lib/api.js";

export default function RestartBanner({ showToast, onRestarted }) {
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await api.post("/api/versions/restart");
      showToast?.("Server restart initiated", "success");
      onRestarted?.();
    } catch (err) {
      showToast?.(err.message || "Failed to restart server", "error");
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <div className="rounded-[12px] p-4 bg-[#1a1d24] border border-[#fbbf24]/40 border-l-4 border-l-[#fbbf24] select-none shadow-sm flex items-center justify-between gap-3 mb-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertTriangle size={18} className="text-[#fbbf24] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h4 className="text-[13.5px] font-semibold text-[#e5e7eb] leading-snug">
            Restart required to apply changes
          </h4>
          <p className="text-[11.5px] text-[#9ca3af] truncate mt-0.5">
            New version or Geyser plugin installed
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={isRestarting}
        onClick={handleRestart}
        className="h-[36px] px-3.5 rounded-[8px] bg-[#fbbf24] hover:bg-[#f59e0b] text-[#0f1115] text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
      >
        {isRestarting ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
        <span>Restart Now</span>
      </button>
    </div>
  );
}
