import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Check,
  Terminal,
  Loader2,
} from 'lucide-react';
import SkeletonCard from '../SkeletonCard.jsx';
import ConfirmModal from '../ConfirmModal.jsx';
import { api } from '../../lib/api.js';

/**
 * Playit.gg remote connectivity tunnel card.
 * Handles:
 * - Loading: SkeletonCard
 * - State 1: Not Claimed (claimed === false && !error)
 * - State 2: Claimed (claimed === true && !error)
 * - State 3: Error (error !== null)
 */
export default function TunnelCard({
  tunnelData,
  isLoading = false,
  onReconnect,
  onRetry,
  onRegenerateClaim,
  onCopy,
  showToast,
}) {
  const navigate = useNavigate();
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedClaim, setCopiedClaim] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [reconnectModalOpen, setReconnectModalOpen] = useState(false);
  const [localClaimUrl, setLocalClaimUrl] = useState(null);

  // Loading state
  if (isLoading || !tunnelData) {
    return <SkeletonCard rows={3} height="h-44" />;
  }

  const {
    claimed = false,
    claimUrl: rawClaimUrl = null,
    address = null,
    region = null,
    latency = null,
    uptime = null,
    error = null,
  } = tunnelData;

  const currentClaimUrl = localClaimUrl || rawClaimUrl;

  const handleCopyText = (text, label) => {
    if (!text) return;
    if (onCopy) {
      onCopy(text, label);
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      showToast?.(label, 'success');
    }
  };

  // Regenerate claim link handler
  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      if (onRegenerateClaim) {
        const res = await onRegenerateClaim();
        if (res && res.claimUrl) {
          setLocalClaimUrl(res.claimUrl);
        }
      } else {
        const res = await api.regeneratePlayitClaim();
        if (res && res.claimUrl) {
          setLocalClaimUrl(res.claimUrl);
          showToast?.('Claim link regenerated', 'success');
        }
      }
    } catch {
      showToast?.('Failed to regenerate link', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Reconnect tunnel handler
  const handleReconnectConfirm = async () => {
    setReconnectModalOpen(false);
    setIsReconnecting(true);
    showToast?.('Reconnecting tunnel...', 'success');
    try {
      if (onReconnect) {
        await onReconnect();
      } else {
        await api.reconnectPlayit();
      }
    } catch {
      showToast?.('Failed to reconnect tunnel', 'error');
    } finally {
      setIsReconnecting(false);
    }
  };

  // Retry handler
  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      } else {
        await api.retryPlayit();
      }
    } catch {
      showToast?.('Retry failed', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  const getLatencyColor = (ms) => {
    if (typeof ms !== 'number') return 'text-[#9ca3af]';
    if (ms < 50) return 'text-[#4ade80]';
    if (ms <= 150) return 'text-[#fbbf24]';
    return 'text-[#ef4444]';
  };

  // ═══════════════════════════════════════════
  // STATE 3: ERROR (error !== null)
  // ═══════════════════════════════════════════
  if (error !== null && error !== undefined) {
    return (
      <div className="rounded-[12px] bg-[#1a1d24] border border-[#262a33] border-l-4 border-l-[#ef4444] p-3.5 select-none shadow-sm space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ef4444]/15 text-[#ef4444] flex items-center justify-center shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#ef4444]">
                Tunnel Error
              </h3>
              <p className="text-[12px] text-[#9ca3af]">
                Failed to connect to playit.gg
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            aria-label="Regenerate claim link"
            title="Regenerate claim link"
            className="p-1.5 rounded-[6px] text-[#9ca3af] hover:text-[#4ade80] hover:bg-[#262a33] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isRegenerating ? (
              <Loader2 size={16} className="animate-spin text-[#4ade80]" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>

        {/* Error message */}
        <div className="p-2.5 rounded-[8px] bg-[#0a0c10] border border-[#262a33] font-mono text-[11.5px] text-[#ef4444] break-all">
          Error: {error}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 h-[36px] rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isRetrying ? (
              <Loader2 size={13} className="animate-spin text-[#4ade80]" />
            ) : (
              <RefreshCw size={13} />
            )}
            <span>Retry</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/console')}
            className="flex-1 h-[36px] rounded-[8px] bg-[#262a33]/60 hover:bg-[#262a33] text-[#9ca3af] hover:text-[#e5e7eb] text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Terminal size={13} />
            <span>View Logs</span>
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STATE 1: NOT CLAIMED (claimed === false)
  // ═══════════════════════════════════════════
  if (!claimed) {
    return (
      <div className="rounded-[12px] bg-[#1a1d24] border border-[#262a33] border-l-4 border-l-[#fbbf24] p-3.5 select-none shadow-sm space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fbbf24]/15 text-[#fbbf24] flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#fbbf24]">
                Server Not Connected
              </h3>
              <p className="text-[12px] text-[#9ca3af]">
                Claim your playit.gg tunnel to go live
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            aria-label="Regenerate claim link"
            title="Regenerate claim link"
            className="p-1.5 rounded-[6px] text-[#9ca3af] hover:text-[#4ade80] hover:bg-[#262a33] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isRegenerating ? (
              <Loader2 size={16} className="animate-spin text-[#4ade80]" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>

        {/* Claim URL Box */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-[#9ca3af] block">
            Claim URL
          </span>
          <div
            onClick={() => {
              if (currentClaimUrl) {
                handleCopyText(currentClaimUrl, 'Copied claim URL');
                setCopiedClaim(true);
                setTimeout(() => setCopiedClaim(false), 2000);
              }
            }}
            className="p-2.5 rounded-[8px] bg-[#0a0c10] border border-[#262a33] font-mono text-[11.5px] text-[#e5e7eb] truncate cursor-pointer hover:border-[#4ade80]/50 transition-colors flex items-center justify-between"
            title="Tap to copy link"
          >
            <span className="truncate">
              {currentClaimUrl || 'No active claim URL'}
            </span>
            {copiedClaim ? (
              <Check size={13} className="text-[#4ade80] shrink-0 ml-1.5" />
            ) : (
              <Copy size={13} className="text-[#9ca3af] shrink-0 ml-1.5" />
            )}
          </div>
        </div>

        {/* Action Buttons (50% width each) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={!currentClaimUrl}
            onClick={() => {
              if (currentClaimUrl) {
                handleCopyText(currentClaimUrl, 'Copied claim URL');
                setCopiedClaim(true);
                setTimeout(() => setCopiedClaim(false), 2000);
              }
            }}
            className="flex-1 h-[36px] rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Copy size={13} />
            <span>{copiedClaim ? 'Copied' : 'Copy Link'}</span>
          </button>
          <button
            type="button"
            disabled={!currentClaimUrl}
            onClick={() => {
              if (currentClaimUrl) {
                window.open(currentClaimUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            className="flex-1 h-[36px] rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <span>Open Claim Page</span>
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Helper text */}
        <p className="text-[11px] text-[#6b7280] leading-tight text-center">
          Claim links expire after some time. Regenerate if it stops working.
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STATE 2: CLAIMED (claimed === true)
  // ═══════════════════════════════════════════
  return (
    <div className="rounded-[12px] bg-[#1a1d24] border border-[#262a33] border-l-4 border-l-[#4ade80] p-3.5 select-none shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#4ade80]/15 text-[#4ade80] flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[#4ade80]">
            Tunnel Active
          </h3>
          <p className="text-[12px] text-[#9ca3af]">
            Connected via playit.gg edge routing
          </p>
        </div>
      </div>

      {/* Public Server Address Box */}
      <div className="space-y-1">
        <span className="text-[11px] font-medium text-[#9ca3af] block">
          Public Server Address
        </span>
        <div
          onClick={() => {
            if (address) {
              handleCopyText(address, 'Server address copied');
              setCopiedAddr(true);
              setTimeout(() => setCopiedAddr(false), 2000);
            }
          }}
          className="p-2.5 rounded-[8px] bg-[#0a0c10] border border-[#262a33] hover:border-[#4ade80]/50 transition-colors cursor-pointer flex items-center justify-between group"
          title="Tap to copy public IP:Port"
        >
          <span className="font-mono text-[13px] font-semibold text-[#e5e7eb] truncate">
            {address || '—'}
          </span>
          <button
            type="button"
            aria-label="Copy server address"
            className="p-1 text-[#9ca3af] group-hover:text-[#4ade80] transition-colors"
          >
            {copiedAddr ? (
              <Check size={14} className="text-[#4ade80]" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Info Rows */}
      <div className="pt-1 border-t border-[#262a33]/60 space-y-2 text-[12px]">
        <div className="flex justify-between items-center">
          <span className="text-[#9ca3af]">Region</span>
          <span className="text-[#e5e7eb] font-medium">{region || '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9ca3af]">Latency</span>
          <span className={`font-mono font-medium ${getLatencyColor(latency)}`}>
            {typeof latency === 'number' ? `${latency} ms` : '—'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9ca3af]">Uptime</span>
          <span className="text-[#e5e7eb] font-mono">{uptime || '—'}</span>
        </div>
      </div>

      {/* Reconnect Button */}
      <div className="pt-1 border-t border-[#262a33]/60 flex justify-end">
        <button
          type="button"
          disabled={isReconnecting}
          onClick={() => setReconnectModalOpen(true)}
          className="text-[11.5px] text-[#9ca3af] hover:text-[#e5e7eb] transition-colors flex items-center gap-1.5 py-1 px-2 rounded-[6px] hover:bg-[#262a33] cursor-pointer disabled:opacity-50"
        >
          {isReconnecting ? (
            <Loader2 size={12} className="animate-spin text-[#4ade80]" />
          ) : (
            <RefreshCw size={12} />
          )}
          <span>Reconnect Tunnel</span>
        </button>
      </div>

      {/* Reconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={reconnectModalOpen}
        title="Reconnect Playit Tunnel?"
        message="Tunnel connections will momentarily reset while reconnecting to the edge gateway."
        confirmText="Reconnect"
        confirmVariant="warning"
        onCancel={() => setReconnectModalOpen(false)}
        onConfirm={handleReconnectConfirm}
      />
    </div>
  );
}
