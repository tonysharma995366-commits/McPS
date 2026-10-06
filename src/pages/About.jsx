import React, { useState, useEffect } from "react";
import TunnelCard from "../components/about/TunnelCard.jsx";
import SystemDiagnosticsCard from "../components/about/SystemDiagnosticsCard.jsx";
import ServerInfoCard from "../components/about/ServerInfoCard.jsx";
import UpdateChecksCard from "../components/about/UpdateChecksCard.jsx";
import MaintenanceCard from "../components/about/MaintenanceCard.jsx";
import AppInfoCard from "../components/about/AppInfoCard.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

export default function About({ showToast }) {
  const { data: tunnel, loading: lTunnel, refetch: rTunnel } = useFetch("/api/playit");
  const { data: diag, loading: lDiag, refetch: rDiag } = useFetch("/api/system/diagnostics");
  const { data: info, loading: lInfo, refetch: rInfo } = useFetch("/api/system/info");
  const { data: updates, loading: lUpdates, refetch: rUpdates } = useFetch("/api/system/updates");

  const [openSections, setOpenSections] = useState({
    diagnostics: true,
    serverInfo: true,
    updates: true,
    maintenance: false,
    appInfo: true,
  });

  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: () => {},
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) {
        rTunnel();
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [rTunnel]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text, label = "Copied to clipboard") => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      }
      showToast?.(label, "success");
    } catch {
      showToast?.("Failed to copy", "error");
    }
  };

  const handleReconnectTunnel = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Reconnect Playit Tunnel?",
      message: "Tunnel connections will momentarily reset while reconnecting.",
      confirmText: "Reconnect",
      confirmVariant: "warning",
      onConfirm: async () => {
        try {
          showToast?.("Reconnecting tunnel...", "success");
          await api.reconnectPlayit();
          rTunnel();
        } catch (err) {
          showToast?.(err.message || "Failed to reconnect tunnel", "error");
        }
      },
    });
  };

  const handleRetryTunnel = async () => {
    try {
      showToast?.("Retrying connection...", "success");
      await api.retryPlayit();
      rTunnel();
    } catch (err) {
      showToast?.(err.message || "Retry failed", "error");
    }
  };

  const handleRegenerateClaim = async () => {
    try {
      const res = await api.regeneratePlayitClaim();
      showToast?.("Claim link regenerated", "success");
      rTunnel();
      return res;
    } catch (err) {
      showToast?.(err.message || "Failed to regenerate link", "error");
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await api.checkSystemUpdates();
      rUpdates();
      showToast?.("Updated information fetched", "success");
    } catch (err) {
      showToast?.(err.message || "Failed to check updates", "error");
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleDownloadLogs = () => {
    showToast?.("Downloading server logs...", "success");
    window.location.href = api.getDownloadSystemLogsUrl();
  };

  const handleClearLogs = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Clear Server Logs?",
      message: "This will truncate the existing console log file.",
      confirmText: "Clear Logs",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.clearSystemLogs();
          showToast?.("Logs cleared", "success");
        } catch (err) {
          showToast?.(err.message || "Failed to clear logs", "error");
        }
      },
    });
  };

  const handleClearCache = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Clear Cache Files?",
      message: "Temporary chunk and entity caches will be purged.",
      confirmText: "Clear Cache",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.clearSystemCache();
          showToast?.("Cache purged", "success");
        } catch (err) {
          showToast?.(err.message || "Failed to purge cache", "error");
        }
      },
    });
  };

  const handleRestartContainer = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Restart Railway Container?",
      message: "Reboots the entire container process.",
      confirmText: "Reboot Container",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.restartContainer();
          showToast?.("Container restart initiated", "success");
        } catch (err) {
          showToast?.(err.message || "Restart failed", "error");
        }
      },
    });
  };

  const handleForceKill = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Force Stop Server?",
      message: "Sends SIGKILL to Java process immediately.",
      confirmText: "Force Kill",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.killServer();
          showToast?.("Process terminated", "success");
        } catch (err) {
          showToast?.(err.message || "Failed to kill process", "error");
        }
      },
    });
  };

  const isLoading = lTunnel || lDiag || lInfo || lUpdates;

  return (
    <div className="space-y-3 pb-[80px] select-none relative min-h-[calc(100vh-140px)]">
      <TunnelCard
        tunnelData={tunnel}
        isLoading={lTunnel}
        onReconnect={handleReconnectTunnel}
        onRetry={handleRetryTunnel}
        onRegenerateClaim={handleRegenerateClaim}
        onCopy={handleCopy}
        showToast={showToast}
      />

      {isLoading ? (
        <div className="space-y-3 pt-1">
          <SkeletonCard rows={4} height="h-32" />
          <SkeletonCard rows={3} height="h-28" />
        </div>
      ) : (
        <>
          <SystemDiagnosticsCard
            diagnostics={diag || {}}
            isOpen={openSections.diagnostics}
            onToggle={() => toggleSection("diagnostics")}
            onCopy={handleCopy}
          />

          <ServerInfoCard
            info={info || {}}
            isOpen={openSections.serverInfo}
            onToggle={() => toggleSection("serverInfo")}
          />

          <UpdateChecksCard
            updates={updates || {}}
            isOpen={openSections.updates}
            onToggle={() => toggleSection("updates")}
            onCheckUpdates={handleCheckUpdates}
            isChecking={isCheckingUpdates}
          />

          <MaintenanceCard
            isOpen={openSections.maintenance}
            onToggle={() => toggleSection("maintenance")}
            onDownloadLogs={handleDownloadLogs}
            onRequestClearLogs={handleClearLogs}
            onRequestClearCache={handleClearCache}
            onRequestRestartContainer={handleRestartContainer}
            onRequestForceKill={handleForceKill}
          />

          <AppInfoCard
            isOpen={openSections.appInfo}
            onToggle={() => toggleSection("appInfo")}
          />
        </>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmVariant={confirmConfig.confirmVariant}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          confirmConfig.onConfirm?.();
        }}
      />
    </div>
  );
}
