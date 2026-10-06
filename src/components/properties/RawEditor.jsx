import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Copy, Download, RotateCw, AlertTriangle, Check } from 'lucide-react';

/**
 * Full plain text editor for raw server.properties with line numbers gutter,
 * copy/download actions, and syntax validation.
 */
export default function RawEditor({
  rawText,
  onChange,
  onReload,
  isDirty,
  onCopy,
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Compute line count
  const lineCount = useMemo(() => {
    return (rawText.match(/\n/g) || []).length + 1;
  }, [rawText]);

  // Generate line numbers text
  const lineNumbersString = useMemo(() => {
    const nums = [];
    for (let i = 1; i <= Math.max(lineCount, 1); i++) {
      nums.push(i);
    }
    return nums.join('\n');
  }, [lineCount]);

  // Raw syntax validation
  const validationIssues = useMemo(() => {
    const issues = [];
    const lines = rawText.split('\n');
    let hasPort = false;
    let hasLevel = false;
    let hasMotd = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (!trimmed.includes('=')) {
        issues.push(`Line ${idx + 1}: Missing "=" delimiter in "${trimmed.slice(0, 24)}"`);
      } else {
        const [k] = trimmed.split('=');
        const key = k.trim();
        if (key === 'server-port') hasPort = true;
        if (key === 'level-name') hasLevel = true;
        if (key === 'motd') hasMotd = true;
      }
    });

    if (!hasPort) issues.push('Missing recommended key: "server-port"');
    if (!hasLevel) issues.push('Missing recommended key: "level-name"');
    if (!hasMotd) issues.push('Missing recommended key: "motd"');

    return issues;
  }, [rawText]);

  const handleCopyClick = () => {
    onCopy(rawText, 'Copied raw server.properties');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClick = () => {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'server.properties';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2 select-none">
      {/* Editor Container */}
      <div className="rounded-[10px] bg-[#0a0c10] border border-[#262a33] overflow-hidden flex flex-col shadow-inner">
        {/* Toolbar Header */}
        <div className="h-[42px] px-3 bg-[#14171d] border-b border-[#262a33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-semibold text-[#e5e7eb]">
              server.properties
            </span>
            <span className="text-[10.5px] font-mono text-[#6b7280]">
              {lineCount} lines • {new Blob([rawText]).size} B
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyClick}
              className="p-1.5 rounded-[6px] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#262a33] transition-colors cursor-pointer"
              title="Copy all to clipboard"
            >
              {copied ? <Check size={14} className="text-[#4ade80]" /> : <Copy size={14} />}
            </button>

            {/* Download button */}
            <button
              type="button"
              onClick={handleDownloadClick}
              className="p-1.5 rounded-[6px] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#262a33] transition-colors cursor-pointer"
              title="Download server.properties file"
            >
              <Download size={14} />
            </button>

            {/* Reload from server */}
            <button
              type="button"
              onClick={onReload}
              className="p-1.5 rounded-[6px] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#262a33] transition-colors cursor-pointer"
              title="Reload from server"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Text Area + Line Gutter Container */}
        <div className="relative flex flex-1 min-h-[58vh] max-h-[68vh] overflow-hidden bg-[#0a0c10]">
          {/* Line Numbers Gutter */}
          <pre
            ref={lineNumbersRef}
            aria-hidden="true"
            className="w-[42px] shrink-0 py-3 pr-2 text-right font-mono text-[11.5px] leading-[20px] text-[#4b5563] bg-[#0f1115]/50 border-r border-[#262a33]/60 overflow-hidden select-none"
          >
            {lineNumbersString}
          </pre>

          {/* Editable Textarea */}
          <textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            rows={Math.max(lineCount, 15)}
            className="flex-1 py-3 px-3 font-mono text-[12px] leading-[20px] text-[#e5e7eb] bg-transparent resize-none outline-none overflow-y-auto overscroll-contain whitespace-pre tab-4"
          />
        </div>
      </div>

      {/* Validation Warnings Banner */}
      {validationIssues.length > 0 && (
        <div className="p-3 rounded-[8px] bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[12px] text-[#fbbf24] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={15} className="shrink-0" />
            <span>Format warnings detected:</span>
          </div>
          <ul className="list-disc list-inside text-[11.5px] text-[#fbbf24]/90 space-y-0.5 font-mono pl-1">
            {validationIssues.slice(0, 4).map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
            {validationIssues.length > 4 && (
              <li>...and {validationIssues.length - 4} more issue(s)</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
