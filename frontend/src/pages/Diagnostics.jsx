import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Copy,
  Download,
  Loader2,
  Check,
  Stethoscope,
  Share2,
} from 'lucide-react';
import SummaryCard from '../components/diagnostics/SummaryCard.jsx';
import CheckSection from '../components/diagnostics/CheckSection.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import {
  runAllDiagnostics,
  generatePlainTextReport,
  lastDiagnosticReport,
} from '../lib/diagnostics.js';

export default function Diagnostics({ showToast }) {
  const [report, setReport] = useState(lastDiagnosticReport);
  const [isRunningAll, setIsRunningAll] = useState(!lastDiagnosticReport);
  const [rerunningId, setRerunningId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedReport, setCopiedReport] = useState(false);

  const isMountedRef = useRef(true);
  const autoRefreshTimerRef = useRef(null);

  // Execute full diagnostic check suite
  const executeChecks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRunningAll(true);
    try {
      const res = await runAllDiagnostics();
      if (isMountedRef.current) {
        setReport(res);
        if (!isSilent) {
          showToast?.(`Diagnostics complete: ${res.summary.passed}/${res.summary.total} passed`, 'success');
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        showToast?.(err.message || 'Diagnostic verification failed', 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setIsRunningAll(false);
      }
    }
  }, [showToast]);

  // Initial mount & Auto-refresh (30s)
  useEffect(() => {
    isMountedRef.current = true;

    // Small delay on first mount so UI shell paints instantly
    const initialTimer = setTimeout(() => {
      executeChecks(Boolean(lastDiagnosticReport));
    }, 200);

    // 30s auto-refresh timer
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          executeChecks(true);
        }
      }, 30000);
    }

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimer);
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [executeChecks, autoRefresh]);

  // Desktop keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        executeChecks(false);
        showToast?.('Re-running all diagnostics...', 'success');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeChecks, showToast]);

  // Single check re-run
  const handleRerunSingleCheck = async (checkId) => {
    setRerunningId(checkId);
    try {
      await executeChecks(true);
      showToast?.('Check updated', 'success');
    } finally {
      if (isMountedRef.current) {
        setRerunningId(null);
      }
    }
  };

  // Copy plain text report
  const handleCopyReport = () => {
    if (!report) return;
    const plainText = generatePlainTextReport(report);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(plainText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = plainText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedReport(true);
      showToast?.('Report copied to clipboard', 'success');
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      showToast?.('Failed to copy report', 'error');
    }
  };

  // Download plain text report file (.txt)
  const handleDownloadReport = () => {
    if (!report) return;
    const plainText = generatePlainTextReport(report);
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mc-railadmin-diagnostics-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast?.('Report downloaded', 'success');
  };

  const sections = report?.sections || [];

  return (
    <div className="space-y-3 pb-[90px] select-none relative min-h-[calc(100vh-140px)]">
      {/* ── SECTION 1: TOP SUMMARY CARD ── */}
      {report ? (
        <SummaryCard
          summary={report.summary}
          lastChecked={report.timestamp}
          isRunningAll={isRunningAll}
          onRunAll={() => executeChecks(false)}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        />
      ) : (
        <SkeletonCard rows={3} height="h-44" />
      )}

      {/* ── SECTION 2: 9 CHECK SUBSYSTEM SECTIONS ── */}
      {sections.length > 0 ? (
        <div className="space-y-2.5 pt-1">
          {sections.map((sec) => (
            <CheckSection
              key={sec.id}
              section={sec}
              onRerunCheck={handleRerunSingleCheck}
              rerunningId={rerunningId}
              showToast={showToast}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <SkeletonCard rows={4} height="h-32" />
          <SkeletonCard rows={4} height="h-32" />
          <SkeletonCard rows={4} height="h-32" />
        </div>
      )}

      {/* ── SECTION 3: EXPORT & REPORT ACTIONS (bottom) ── */}
      {report && (
        <div className="pt-3 space-y-2">
          <button
            type="button"
            onClick={() => executeChecks(false)}
            disabled={isRunningAll}
            className="w-full h-[42px] rounded-[10px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isRunningAll ? (
              <Loader2 size={16} className="animate-spin text-[#0f1115]" />
            ) : (
              <Play size={16} className="fill-current" />
            )}
            <span>Run All Checks</span>
          </button>

          <button
            type="button"
            onClick={handleCopyReport}
            className="w-full h-[40px] rounded-[10px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[13px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copiedReport ? (
              <Check size={15} className="text-[#4ade80]" />
            ) : (
              <Copy size={15} />
            )}
            <span>{copiedReport ? 'Report Copied' : 'Copy Full Report'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="w-full h-[38px] rounded-[10px] bg-transparent hover:bg-[#1a1d24] text-[#9ca3af] hover:text-[#e5e7eb] text-[12px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#262a33]/60"
          >
            <Download size={14} />
            <span>Download Report (.txt)</span>
          </button>
        </div>
      )}
    </div>
  );
}
