import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Play,
  RotateCw,
  Square,
  Archive,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Card from "../components/Card.jsx";
import StatRow from "../components/StatRow.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Toggle from "../components/Toggle.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";
import { formatUptime, timeAgo } from "../lib/format.js";

export default function Dashboard({ showToast, onStatusChange }) {
  const navigate = useNavigate();

  const { data: status, loading, error, refetch } = useFetch("/api/status");
  const { data: playit } = useFetch("/api/playit");
  const { data: logsData } = useFetch("/api/logs?limit=6");

  const [actionInProgress, setActionInProgress] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    action: null,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
  });

  // Polling every 5 seconds for live status
  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(timer);
  }, [refetch]);

  // Sync status to topbar parent if callback exists
  useEffect(() => {
    if (status?.status && onStatusChange) {
      onStatusChange(status.status);
    }
  }, [status, onStatusChange]);

  const handleCopy = async (text, label = "Copied!") => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showToast?.(label, "success");
    } catch {
      showToast?.("Failed to copy", "error");
    }
  };

  const executeServerAction = async (action) => {
    setActionInProgress(action);
    try {
      if (action === "start") {
        await api.startServer();
        showToast?.("Server start signal sent", "success");
      } else if (action === "stop") {
        await api.stopServer();
        showToast?.("Server stopped successfully", "success");
      } else if (action === "restart") {
        await api.restartServer();
        showToast?.("Server restart initiated", "success");
      } else if (action === "backup") {
        await api.backupServer();
        showToast?.("World backup created successfully", "success");
      }
      await refetch();
    } catch (err) {
      showToast?.(err.message || `Failed to ${action} server`, "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleActionClick = (action) => {
    if (action === "start") {
      executeServerAction("start");
      return;
    }
    if (action === "stop") {
      setModalConfig({
        isOpen: true,
        action: "stop",
        title: "Stop Minecraft Server?",
        message: "All active players will be disconnected and world changes will be flushed to disk.",
        confirmText: "Stop Server",
        confirmVariant: "danger",
      });
      return;
    }
    if (action === "restart") {
      setModalConfig({
        isOpen: true,
        action: "restart",
        title: "Restart Server?",
        message: "The server will restart. Players will be temporarily kicked while the server reboots.",
        confirmText: "Restart",
        confirmVariant: "warning",
      });
      return;
    }
    if (action === "backup") {
      setModalConfig({
        isOpen: true,
        action: "backup",
        title: "Create World Backup?",
        message: "A fresh snapshot of the Minecraft world will be compressed and saved.",
        confirmText: "Create Backup",
        confirmVariant: "warning",
      });
      return;
    }
  };

  const handleTogglePerformance = async (newVal) => {
    setPerformanceLoading(true);
    try {
      await api.setPerformanceMode(newVal);
      showToast?.(`Performance mode ${newVal ? "enabled" : "disabled"}`, "success");
      await refetch();
    } catch {
      showToast?.("Failed to update performance mode", "error");
    } finally {
      setPerformanceLoading(false);
    }
  };

  const serverStatus = (status?.status || "stopped").toLowerCase();
  const isRunning = serverStatus === "running";
  const isStopped = serverStatus === "stopped" || serverStatus === "offline";
  const isStarting = serverStatus === "starting" || serverStatus === "restarting";

  // Dot color & label
  let statusDotClass = "bg-[#4ade80]";
  let statusLabel = "Running";
  if (isStopped) {
    statusDotClass = "bg-[#ef4444]";
    statusLabel = "Stopped";
  } else if (isStarting) {
    statusDotClass = "bg-[#fbbf24] animate-pulse";
    statusLabel = "Starting";
  }

  // Formatting values with '—' fallbacks
  const playersOnline = status?.players?.online ?? status?.players;
  const playersMax = status?.players?.max;
  const playersText =
    playersOnline != null && playersMax != null
      ? `${playersOnline}/${playersMax}`
      : "—";

  const tpsText = status?.tps != null ? Number(status.tps).toFixed(1) : "—";

  let ramText = "—";
  let ramPercent = 0;
  if (status?.ram?.used != null && status?.ram?.total != null) {
    const used = (status.ram.used / 1024).toFixed(1);
    const total = (status.ram.total / 1024).toFixed(1);
    ramText = `${used}/${total} GB`;
    ramPercent = status.ram.total > 0 ? (status.ram.used / status.ram.total) * 100 : 0;
  }

  const cpuPercent = typeof status?.cpu === "number" ? status.cpu : 0;
  let diskText = "—";
  let diskPercent = 0;
  if (status?.disk?.used != null && status?.disk?.total != null) {
    const used = (status.disk.used / 1024).toFixed(1);
    const total = (status.disk.total / 1024).toFixed(1);
    diskText = `${used}/${total} GB`;
    diskPercent = status.disk.total > 0 ? (status.disk.used / status.disk.total) * 100 : 0;
  }

  const uptimeText = isRunning && status?.uptime ? formatUptime(status.uptime) : "Offline";
  const logLines = Array.isArray(logsData) ? logsData : logsData?.lines || logsData?.logs || [];

  return (
    <div className="space-y-3 pb-2 select-none">
      {/* Playit Banner (rendered only if playit exists and is unclaimed) */}
      {playit && !playit.claimed && playit.claimUrl && (
        <div className="rounded-[12px] p-[14px] bg-[#1a1d24] border border-[#262a33] border-l-4 border-l-[#fbbf24]">
          <div className="flex items-start gap-2.5 mb-2">
            <AlertTriangle size={18} className="text-[#fbbf24] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-bold text-[#e5e7eb] leading-snug">
                Server not connected
              </h3>
              <p className="text-[12px] text-[#9ca3af] leading-tight">
                Claim your playit.gg tunnel to go live
              </p>
            </div>
          </div>

          <div
            onClick={() => handleCopy(playit.claimUrl, "Claim URL copied!")}
            className="w-full bg-[#0f1115] border border-[#262a33] rounded-[6px] px-2.5 py-1.5 font-mono text-[11px] text-[#9ca3af] truncate mb-2.5 cursor-pointer active:bg-[#262a33] transition-colors duration-150"
            title="Tap to copy claim link"
          >
            {playit.claimUrl}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCopy(playit.claimUrl, "Claim URL copied!")}
              className="min-h-[40px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer"
            >
              <Copy size={14} />
              <span>Copy Link</span>
            </button>
            <a
              href={playit.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer"
            >
              <span>Open</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Status Card */}
      {loading ? (
        <SkeletonCard rows={3} height="h-36" />
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : (
        <Card stopped={isStopped}>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
              <span className="text-[14px] font-semibold text-[#e5e7eb]">
                {statusLabel}
              </span>
            </div>
            <span className="text-[12px] text-[#9ca3af]">
              {uptimeText}
            </span>
          </div>

          {/* Stats Row */}
          <div className="my-1">
            <StatRow
              stats={[
                { label: "Players", value: playersText },
                { label: "TPS", value: tpsText },
                { label: "RAM", value: ramText },
              ]}
            />
          </div>

          <div className="border-t border-[#262a33] my-3" />

          {/* Address Row */}
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#9ca3af] font-medium">Address</span>
            <button
              type="button"
              onClick={() => status?.address && handleCopy(status.address, "Address copied!")}
              className={`flex items-center gap-1.5 text-[#e5e7eb] ${
                status?.address ? "hover:text-[#4ade80] cursor-pointer" : "cursor-default"
              } font-mono transition-colors duration-150 group`}
            >
              <span>{status?.address || "Not connected"}</span>
              {status?.address && (
                <Copy size={13} className="text-[#9ca3af] group-hover:text-[#4ade80] transition-colors" />
              )}
            </button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-[14px] font-semibold text-[#e5e7eb] mb-2">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {/* Start */}
          <button
            type="button"
            disabled={loading || !isStopped || actionInProgress !== null}
            onClick={() => handleActionClick("start")}
            className={`
              min-h-[48px] h-[48px] rounded-[8px] bg-[#1a1d24] border border-[#262a33]
              flex items-center justify-center gap-2 text-[13px] font-medium transition-colors
              ${
                loading || !isStopped
                  ? "opacity-40 cursor-not-allowed text-[#9ca3af]"
                  : "text-[#4ade80] hover:bg-[#4ade80]/10 hover:border-[#4ade80]/40 cursor-pointer"
              }
            `}
          >
            {actionInProgress === "start" ? (
              <Loader2 size={18} className="animate-spin text-[#4ade80]" />
            ) : (
              <Play size={18} className="text-[#4ade80] fill-[#4ade80]/20" />
            )}
            <span>Start</span>
          </button>

          {/* Restart */}
          <button
            type="button"
            disabled={loading || isStopped || actionInProgress !== null}
            onClick={() => handleActionClick("restart")}
            className={`
              min-h-[48px] h-[48px] rounded-[8px] bg-[#1a1d24] border border-[#262a33]
              flex items-center justify-center gap-2 text-[13px] font-medium transition-colors
              ${
                loading || isStopped
                  ? "opacity-40 cursor-not-allowed text-[#9ca3af]"
                  : "text-[#fbbf24] hover:bg-[#fbbf24]/10 hover:border-[#fbbf24]/40 cursor-pointer"
              }
            `}
          >
            {actionInProgress === "restart" ? (
              <Loader2 size={18} className="animate-spin text-[#fbbf24]" />
            ) : (
              <RotateCw size={18} className="text-[#fbbf24]" />
            )}
            <span>Restart</span>
          </button>

          {/* Stop */}
          <button
            type="button"
            disabled={loading || isStopped || actionInProgress !== null}
            onClick={() => handleActionClick("stop")}
            className={`
              min-h-[48px] h-[48px] rounded-[8px] bg-[#1a1d24] border border-[#262a33]
              flex items-center justify-center gap-2 text-[13px] font-medium transition-colors
              ${
                loading || isStopped
                  ? "opacity-40 cursor-not-allowed text-[#9ca3af]"
                  : "text-[#ef4444] hover:bg-[#ef4444]/10 hover:border-[#ef4444]/40 cursor-pointer"
              }
            `}
          >
            {actionInProgress === "stop" ? (
              <Loader2 size={18} className="animate-spin text-[#ef4444]" />
            ) : (
              <Square size={18} className="text-[#ef4444] fill-[#ef4444]/20" />
            )}
            <span>Stop</span>
          </button>

          {/* Backup */}
          <button
            type="button"
            disabled={loading || actionInProgress !== null}
            onClick={() => handleActionClick("backup")}
            className={`
              min-h-[48px] h-[48px] rounded-[8px] bg-[#1a1d24] border border-[#262a33]
              flex items-center justify-center gap-2 text-[13px] font-medium transition-colors text-[#60a5fa] hover:bg-[#60a5fa]/10 hover:border-[#60a5fa]/40 cursor-pointer
              ${loading || actionInProgress !== null ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {actionInProgress === "backup" ? (
              <Loader2 size={18} className="animate-spin text-[#60a5fa]" />
            ) : (
              <Archive size={18} className="text-[#60a5fa]" />
            )}
            <span>Backup</span>
          </button>
        </div>
      </div>

      {/* System Health */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-semibold text-[#e5e7eb]">
            System Health
          </h2>
        </div>

        {loading ? (
          <SkeletonCard rows={3} height="h-28" />
        ) : (
          <Card>
            <ProgressBar
              label="CPU"
              percentage={status?.cpu != null ? cpuPercent : 0}
              valueText={status?.cpu != null ? `${Math.round(cpuPercent)}%` : "—"}
            />
            <ProgressBar
              label="RAM"
              percentage={ramPercent}
              valueText={status?.ram ? `${(status.ram.used / 1024).toFixed(1)} / ${(status.ram.total / 1024).toFixed(1)} GB` : "—"}
            />
            <ProgressBar
              label="Disk"
              percentage={diskPercent}
              valueText={diskText}
            />
          </Card>
        )}
      </div>

      {/* Console Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-semibold text-[#e5e7eb]">
            Console
          </h2>
          <Link
            to="/console"
            className="text-[12px] font-medium text-[#4ade80] hover:underline flex items-center gap-0.5"
          >
            <span>Open</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div
          onClick={() => navigate("/console")}
          className="rounded-[8px] p-[10px] bg-[#0a0c10] border border-[#262a33] cursor-pointer hover:border-[#323742] transition-colors"
          title="Tap to open full console"
        >
          <div className="space-y-1 font-mono text-[11px] leading-relaxed">
            {logLines.length > 0 ? (
              logLines.slice(-6).map((line, idx) => {
                const lineText = typeof line === "string" ? line : line.message || JSON.stringify(line);
                return (
                  <div key={idx} className="truncate text-[#9ca3af]">
                    <span>{lineText}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-[#6b7280] py-2 text-center">
                No output yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Mode */}
      <div>
        <Card className="flex items-center justify-between gap-3">
          <div className="pr-1">
            <h3 className="text-[14px] font-semibold text-[#e5e7eb] leading-snug">
              Performance Mode
            </h3>
            <p className="text-[12px] text-[#9ca3af] leading-tight mt-0.5">
              Optimizes view distance and chunk generation
            </p>
          </div>
          <Toggle
            checked={Boolean(status?.performanceMode)}
            disabled={performanceLoading}
            onChange={handleTogglePerformance}
          />
        </Card>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmVariant={modalConfig.confirmVariant}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          const act = modalConfig.action;
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          if (act) executeServerAction(act);
        }}
      />
    </div>
  );
}
