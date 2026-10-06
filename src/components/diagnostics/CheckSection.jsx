import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import CheckRow from './CheckRow.jsx';

/**
 * Collapsible section card grouping diagnostic subsystem checks.
 * Auto-expands if any check fails or generates a warning.
 */
export default function CheckSection({
  section,
  onRerunCheck,
  rerunningId,
  showToast,
}) {
  const checks = section.checks || [];
  const passedCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;

  const hasIssues = failCount > 0 || warnCount > 0;
  const [isOpen, setIsOpen] = useState(hasIssues);

  // Auto-expand if issues are detected after check run
  useEffect(() => {
    if (hasIssues) {
      setIsOpen(true);
    }
  }, [hasIssues]);

  const getChip = () => {
    if (failCount > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 flex items-center gap-1">
          <XCircle size={11} />
          <span>{passedCount}/{checks.length}</span>
        </span>
      );
    }
    if (warnCount > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30 flex items-center gap-1">
          <AlertTriangle size={11} />
          <span>{passedCount}/{checks.length}</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 flex items-center gap-1">
        <CheckCircle2 size={11} />
        <span>{passedCount}/{checks.length}</span>
      </span>
    );
  };

  return (
    <div className="rounded-[12px] bg-[#14171d] border border-[#262a33] overflow-hidden shadow-sm transition-colors">
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[48px] px-3.5 flex items-center justify-between hover:bg-[#1a1d24]/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-[14px] font-semibold text-[#e5e7eb] tracking-tight">
            {section.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {getChip()}
          <ChevronDown
            size={16}
            className={`text-[#9ca3af] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Check List Body */}
      {isOpen && (
        <div className="p-3 pt-1 border-t border-[#262a33]/60 space-y-2">
          {checks.map((check) => (
            <CheckRow
              key={check.id}
              check={check}
              onRerun={() => onRerunCheck?.(check.id)}
              isRerunning={rerunningId === check.id}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
