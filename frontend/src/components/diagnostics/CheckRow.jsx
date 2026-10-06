import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronDown } from 'lucide-react';
import CheckDetails from './CheckDetails.jsx';

/**
 * Single diagnostic item row with expandable details payload.
 */
export default function CheckRow({
  check,
  onRerun,
  isRerunning = false,
  showToast,
}) {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 size={16} className="text-[#4ade80] shrink-0" />;
      case 'warn':
        return <AlertTriangle size={16} className="text-[#fbbf24] shrink-0" />;
      case 'fail':
        return <XCircle size={16} className="text-[#ef4444] shrink-0" />;
      default:
        return <Loader2 size={16} className="text-[#9ca3af] animate-spin shrink-0" />;
    }
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="p-3 rounded-[8px] bg-[#1a1d24] border border-[#262a33] hover:border-[#323742] transition-colors cursor-pointer select-none"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="mt-0.5">{getStatusIcon(check.status)}</div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-medium text-[#e5e7eb] leading-tight truncate">
              {check.title}
            </h4>
            <p className="text-[11.5px] text-[#9ca3af] font-mono mt-0.5 truncate">
              {check.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-[#6b7280] font-medium">
            {expanded ? 'Hide' : 'Details'}
          </span>
          <ChevronDown
            size={14}
            className={`text-[#9ca3af] transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {expanded && (
        <div onClick={(e) => e.stopPropagation()}>
          <CheckDetails
            check={check}
            onRerun={onRerun}
            isRerunning={isRerunning}
            showToast={showToast}
          />
        </div>
      )}
    </div>
  );
}
