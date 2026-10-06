import React, { memo } from 'react';
import { RotateCw, AlertTriangle } from 'lucide-react';
import Card from '../Card.jsx';

/**
 * Section 1: Storage Card
 * Displays disk space used by backups with 8px progress bar and warning alert
 */
const StorageCard = memo(function StorageCard({
  storage = { used: null, total: null },
  backupCount = 0,
  oldestText = '',
  isRefreshing = false,
  onRefresh,
}) {
  const hasUsed = typeof storage?.used === 'number' || (storage?.used && !isNaN(parseFloat(storage.used)));
  const hasTotal = typeof storage?.total === 'number' || (storage?.total && !isNaN(parseFloat(storage.total)));

  const used = hasUsed ? Number(storage.used) : null;
  const total = hasTotal ? Number(storage.total) : null;
  const percentage = used !== null && total !== null && total > 0 ? Math.round((used / total) * 100) : 0;
  const isLowStorage = percentage >= 85;

  let barColor = 'bg-[#4ade80]';
  if (percentage >= 90) {
    barColor = 'bg-[#ef4444]';
  } else if (percentage >= 70) {
    barColor = 'bg-[#fbbf24]';
  }

  const storageText = used !== null && total !== null ? `${used} GB / ${total} GB` : '—';

  return (
    <Card className="mb-3 select-none">
      {/* Row 1: Label + Value + Refresh */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] text-[#9ca3af] font-medium">Storage</span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#e5e7eb] font-mono">
            {storageText}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh backups"
            className="p-1 rounded-[6px] text-[#9ca3af] hover:text-[#4ade80] hover:bg-[#262a33] transition-colors duration-150 cursor-pointer disabled:opacity-50"
          >
            <RotateCw size={15} className={isRefreshing ? 'animate-spin text-[#4ade80]' : ''} />
          </button>
        </div>
      </div>

      {/* Warning Chip if >= 85% */}
      {isLowStorage && used !== null && (
        <div className="flex items-center gap-1.5 py-1 px-2 mb-2 rounded-[6px] bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] text-[11px] font-medium">
          <AlertTriangle size={13} className="shrink-0" />
          <span>⚠ Running low on storage — delete old backups</span>
        </div>
      )}

      {/* Row 2: 8px Progress Bar */}
      <div className="flex items-center gap-2.5 my-1.5">
        <div className="flex-1 h-[8px] rounded-full bg-[#262a33] overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-150 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
        <span className="text-[11.5px] font-mono text-[#9ca3af] shrink-0 font-medium w-8 text-right">
          {used !== null ? `${percentage}%` : '—'}
        </span>
      </div>

      {/* Row 3: Meta count & oldest */}
      <div className="text-[11.5px] text-[#9ca3af] mt-1.5">
        <span>{backupCount} {backupCount === 1 ? 'backup' : 'backups'}</span>
        {oldestText && (
          <>
            <span className="text-[#6b7280] mx-1">·</span>
            <span>oldest: {oldestText}</span>
          </>
        )}
      </div>
    </Card>
  );
});

export default StorageCard;
