import React from "react";
import { AlertTriangle } from "lucide-react";

export function ErrorCard({ message, onRetry }) {
  return (
    <div className="rounded-[12px] bg-[#1a1d24] border border-[#ef4444]/40 p-4 select-none">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-[#ef4444] w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#ef4444]">
            Cannot reach server
          </p>
          <p className="text-[12px] text-[#9ca3af] mt-1 font-mono break-all">
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 w-full py-2 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[13px] font-medium text-[#e5e7eb] transition-colors cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorCard;
