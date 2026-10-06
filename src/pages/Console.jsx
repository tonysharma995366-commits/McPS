import React, { useState, useEffect, useRef, useMemo } from "react";
import FilterChips from "../components/FilterChips.jsx";
import LogViewer from "../components/LogViewer.jsx";
import QuickCommands from "../components/QuickCommands.jsx";
import CommandBar from "../components/CommandBar.jsx";
import CommandHistory from "../components/CommandHistory.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { API_URL, WS_URL } from "../lib/config.js";

export default function Console({ showToast, onConnectionChange }) {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState("ALL");
  const [commandText, setCommandText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    command: "",
    title: "",
    message: "",
  });

  const wsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(connected ? "live" : "disconnected");
    }
  }, [connected, onConnectionChange]);

  useEffect(() => {
    setIsLoading(true);

    // Initial fetch of logs
    fetch(`${API_URL}/api/logs?limit=200`)
      .then((r) => r.json())
      .then((d) => {
        const rawLines = Array.isArray(d) ? d : d.lines || d.logs || [];
        setLogs(rawLines);
      })
      .catch(() => setLogs([]))
      .finally(() => setIsLoading(false));

    // Connect WebSocket
    const wsUrl = `${WS_URL}/ws/logs`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.line || msg.message) {
          const item = typeof msg === "string" ? { message: msg } : msg.line ? { message: msg.line, timestamp: msg.timestamp || new Date().toISOString() } : msg;
          setLogs((prev) => [...prev.slice(-499), item]);
        }
      } catch {
        if (typeof e.data === "string") {
          setLogs((prev) => [...prev.slice(-499), { message: e.data, timestamp: new Date().toISOString() }]);
        }
      }
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, []);

  const handleSendCommand = async (cmdString) => {
    let cleanCmd = (cmdString || "").trim();
    if (!cleanCmd || isSending) return;

    if (!cleanCmd.startsWith("/")) {
      cleanCmd = "/" + cleanCmd;
    }

    setCommandHistory((prev) => {
      const filtered = prev.filter((c) => c !== cleanCmd);
      return [cleanCmd, ...filtered].slice(0, 20);
    });

    setCommandText("");
    if (inputRef.current) inputRef.current.focus();

    setIsSending(true);

    try {
      const res = await fetch(`${API_URL}/api/console`, {
        method: "POST",
        headers: { "Content-[#type]": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ command: cleanCmd }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        showToast?.(`Command failed: ${errJson.error || res.statusText}`, "error");
      }
    } catch (err) {
      showToast?.(`Command failed: ${err.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickCommandExecute = (cmd, needsConfirm) => {
    if (needsConfirm) {
      setConfirmModal({
        isOpen: true,
        command: cmd,
        title: "Reload Server?",
        message: "Reloading server configurations and plugins can cause temporary tick drops.",
      });
    } else {
      handleSendCommand(cmd);
    }
  };

  const filteredLogs = useMemo(() => {
    if (filter === "ALL") return logs;

    return logs.filter((log) => {
      const msg = typeof log === "string" ? log : log.message || "";
      const lvl = (log.level || "").toUpperCase();

      if (filter === "INFO") return lvl.includes("INFO") || (!lvl.includes("WARN") && !lvl.includes("ERR"));
      if (filter === "WARN") return lvl.includes("WARN") || /\[.*WARN.*\]/i.test(msg);
      if (filter === "ERROR") return lvl.includes("ERR") || /\[.*ERR.*\]/i.test(msg);
      if (filter === "CHAT") return log.isChat || lvl.includes("CHAT") || /^<.+>/.test(msg);
      return true;
    });
  }, [logs, filter]);

  return (
    <div className="flex flex-col h-screen pt-[52px] pb-[60px] bg-[#0f1115] overflow-hidden select-none">
      <FilterChips
        activeFilter={filter}
        onSelectFilter={(f) => setFilter(f)}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-[#9ca3af] text-[13px]">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-[#9ca3af] text-[13px] font-mono">
            {connected ? "Waiting for server output..." : "Reconnecting..."}
          </div>
        ) : (
          <LogViewer logs={filteredLogs} />
        )}
      </div>

      <QuickCommands
        onSelectCommand={(text) => {
          setCommandText(text);
          if (inputRef.current) inputRef.current.focus();
        }}
        onExecuteCommand={handleQuickCommandExecute}
      />

      <CommandBar
        value={commandText}
        onChange={setCommandText}
        onSend={handleSendCommand}
        isSending={isSending}
        onOpenHistory={() => setHistoryOpen(true)}
        historyCount={commandHistory.length}
        inputRef={inputRef}
      />

      <CommandHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={commandHistory}
        onSelectCommand={(cmd) => {
          setCommandText(cmd);
          if (inputRef.current) inputRef.current.focus();
        }}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Reload"
        confirmVariant="warning"
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          const cmd = confirmModal.command;
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          if (cmd) handleSendCommand(cmd);
        }}
      />
    </div>
  );
}
