import React, { useState } from 'react';
import { RefreshCw, Copy, Check, AlertCircle, Clock } from 'lucide-react';

/**
 * Expandable Details Panel for a Diagnostic Check
 * Displays timestamp, actionable fix recommendation, raw JSON data, and single re-run trigger.
 */
export default function CheckDetails({
  check,
  onRerun,
  isRerunning = false,
  showToast,
}) {
  const [copied, setCopied] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const handleCopyData = () => {
    if (!check.data) return;
    const jsonStr = JSON.stringify(check.data, null, 2);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(jsonStr);
      }
      setCopied(true);
      showToast?.('Details copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast?.('Failed to copy', 'error');
    }
  };

  const hasData = check.data && Object.keys(check.data).length > 0;
  const isFailed = check.status === 'fail' || check.status === 'warn';

  return (
    <div className="mt-2.5 pt-2.5 border-t border-[#262a33]/60 space-y-2.5 text-[12px] animate-in fade-in duration-150">
      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
        <Clock size={12} className="shrink-0" />
        <span>Verified at {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Actionable Fix Suggestion */}
      {isFailed && check.fix && (
        <div className="p-2 rounded-[8px] bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-start gap-2 text-[#fbbf24]">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-[11.5px] leading-snug">
            <span className="font-semibold">Recommendation: </span>
            <span>{check.fix}</span>
          </div>
        </div>
      )}

      {/* Raw Data Toggle / Box */}
      {hasData && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="text-[11px] font-medium text-[#9ca3af] hover:text-[#e5e7eb] transition-colors"
            >
              {jsonExpanded ? '▼ Hide Diagnostic Payload' : '▶ Show Diagnostic Payload'}
            </button>
            <button
              type="button"
              onClick={handleCopyData}
              className="text-[11px] text-[#9ca3af] hover:text-[#4ade80] flex items-center gap-1 transition-colors"
            >
              {copied ? <Check size={11} className="text-[#4ade80]" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {jsonExpanded && (
            <pre className="p-2 rounded-[6px] bg-[#0a0c10] border border-[#262a33] font-mono text-[10.5px] text-[#e5e7eb] overflow-x-auto max-h-40 select-text">
              {JSON.stringify(check.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Re-run button */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRerun?.();
          }}
          disabled={isRerunning}
          className="px-2.5 py-1 rounded-[6px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={11} className={isRerunning ? 'animate-spin text-[#4ade80]' : ''} />
          <span>{isRerunning ? 'Re-checking...' : 'Re-run this check'}</span>
        </button>
      </div>
    </div>
  );
}
