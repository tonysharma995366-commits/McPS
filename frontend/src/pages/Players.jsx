import React, { useState } from "react";
import { RotateCw } from "lucide-react";
import OnlineTab from "../components/players/OnlineTab.jsx";
import WhitelistTab from "../components/players/WhitelistTab.jsx";
import OpsBansTab from "../components/players/OpsBansTab.jsx";
import PlayerActionSheet from "../components/players/PlayerActionSheet.jsx";
import PlayerDetailsSheet from "../components/players/PlayerDetailsSheet.jsx";
import AddPlayerModal from "../components/players/AddPlayerModal.jsx";
import BanModal from "../components/players/BanModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

const TABS = [
  { id: "online", label: "Online" },
  { id: "whitelist", label: "Whitelist" },
  { id: "ops_bans", label: "Ops & Bans" },
];

export default function Players({ showToast }) {
  const [activeTab, setActiveTab] = useState("online");

  const { data: online, loading: lOnline, error: eOnline, refetch: rOnline } = useFetch("/api/players/online");
  const { data: whitelist, loading: lWhitelist, error: eWhitelist, refetch: rWhitelist } = useFetch("/api/players/whitelist");
  const { data: ops, loading: lOps, error: eOps, refetch: rOps } = useFetch("/api/players/ops");
  const { data: bans, loading: lBans, error: eBans, refetch: rBans } = useFetch("/api/players/bans");

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

  const [addModalConfig, setAddModalConfig] = useState({
    isOpen: false,
    type: "whitelist",
    title: "Add Player to Whitelist",
    buttonText: "Add to Whitelist",
  });

  const [banModalConfig, setBanModalConfig] = useState({
    isOpen: false,
    initialName: "",
  });

  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    actionType: null,
    targetName: "",
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
  });

  const handleRefresh = () => {
    if (activeTab === "online") rOnline();
    if (activeTab === "whitelist") rWhitelist();
    if (activeTab === "ops_bans") {
      rOps();
      rBans();
    }
  };

  const handleCopy = async (text, label = "Copied!") => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      }
      showToast?.(label, "success");
    } catch {
      showToast?.("Failed to copy", "error");
    }
  };

  const onlineList = Array.isArray(online) ? online : online?.list || online?.players || [];
  const maxPlayers = online?.max || 20;

  const whitelistData = {
    enabled: whitelist?.enabled ?? false,
    players: Array.isArray(whitelist) ? whitelist : whitelist?.players || [],
  };

  const opsList = Array.isArray(ops) ? ops : ops?.list || [];
  const bansList = Array.isArray(bans) ? bans : bans?.list || [];

  // Actions
  const executeSetOp = async (name, level) => {
    try {
      await api.setOp(name, level);
      showToast?.(level === 0 ? `${name} demoted` : `${name} promoted`, "success");
      rOnline();
      rOps();
    } catch (err) {
      showToast?.(err.message || "Failed to update operator", "error");
    }
  };

  const executeKick = async (name) => {
    try {
      await api.kickPlayer(name, "Kicked by operator");
      showToast?.(`${name} kicked`, "success");
      rOnline();
    } catch (err) {
      showToast?.(err.message || "Failed to kick", "error");
    }
  };

  const executeBan = async (name, reason) => {
    try {
      await api.banPlayer(name, reason);
      showToast?.(`${name} banned`, "success");
      setBanModalConfig({ isOpen: false, initialName: "" });
      rOnline();
      rBans();
    } catch (err) {
      showToast?.(err.message || "Failed to ban", "error");
    }
  };

  const executeUnban = async (name) => {
    try {
      await api.unbanPlayer(name);
      showToast?.(`${name} unbanned`, "success");
      rBans();
    } catch (err) {
      showToast?.(err.message || "Failed to unban", "error");
    }
  };

  const handleToggleWhitelist = async (newVal) => {
    try {
      await api.toggleWhitelist(newVal);
      showToast?.(`Whitelist ${newVal ? "enabled" : "disabled"}`, "success");
      rWhitelist();
    } catch (err) {
      showToast?.(err.message || "Failed to toggle whitelist", "error");
    }
  };

  const handleAddWhitelistPlayer = async (name) => {
    try {
      await api.addWhitelistPlayer(name);
      showToast?.(`${name} added to whitelist`, "success");
      setAddModalConfig((prev) => ({ ...prev, isOpen: false }));
      rWhitelist();
    } catch (err) {
      showToast?.(err.message || "Failed to add to whitelist", "error");
    }
  };

  const handleRemoveWhitelistPlayer = async (name) => {
    try {
      await api.removeWhitelistPlayer(name);
      showToast?.(`${name} removed from whitelist`, "success");
      rWhitelist();
    } catch (err) {
      showToast?.(err.message || "Failed to remove from whitelist", "error");
    }
  };

  return (
    <div className="space-y-3 pb-2 select-none">
      <div className="sticky top-[52px] z-30 bg-[#0f1115] pt-1 pb-2 -mt-1 flex items-center gap-2">
        <div className="flex-1 h-[40px] bg-[#1a1d24] border border-[#262a33] rounded-[10px] p-[3px] grid grid-cols-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                h-full rounded-[8px] text-[12.5px] font-medium transition-colors cursor-pointer flex items-center justify-center truncate px-1
                ${activeTab === tab.id ? "bg-[#262a33] text-[#e5e7eb] font-semibold" : "text-[#9ca3af] hover:text-[#e5e7eb]"}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="w-[40px] h-[40px] rounded-[10px] bg-[#1a1d24] border border-[#262a33] text-[#9ca3af] hover:text-[#4ade80] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <RotateCw size={17} />
        </button>
      </div>

      <div className="pt-1">
        {activeTab === "online" && (
          lOnline ? (
            <SkeletonCard rows={3} height="h-32" />
          ) : eOnline ? (
            <ErrorCard message={eOnline} onRetry={rOnline} />
          ) : (
            <OnlineTab
              players={onlineList}
              maxPlayers={maxPlayers}
              isLoading={false}
              onOpenActions={(p) => {
                setSelectedPlayer(p);
                setActionSheetOpen(true);
              }}
            />
          )
        )}

        {activeTab === "whitelist" && (
          lWhitelist ? (
            <SkeletonCard rows={3} height="h-32" />
          ) : eWhitelist ? (
            <ErrorCard message={eWhitelist} onRetry={rWhitelist} />
          ) : (
            <WhitelistTab
              whitelist={whitelistData}
              isLoading={false}
              onToggleWhitelist={handleToggleWhitelist}
              onOpenAddModal={() =>
                setAddModalConfig({
                  isOpen: true,
                  type: "whitelist",
                  title: "Add Player to Whitelist",
                  buttonText: "Add to Whitelist",
                })
              }
              onRequestRemovePlayer={(name) => {
                setConfirmModalConfig({
                  isOpen: true,
                  actionType: "remove_whitelist",
                  targetName: name,
                  title: `Remove ${name}?`,
                  message: "Player will no longer be allowed on the server when whitelist is active.",
                  confirmText: "Remove",
                  confirmVariant: "danger",
                });
              }}
            />
          )
        )}

        {activeTab === "ops_bans" && (
          (lOps || lBans) ? (
            <SkeletonCard rows={3} height="h-32" />
          ) : (eOps || eBans) ? (
            <ErrorCard message={eOps || eBans} onRetry={() => { rOps(); rBans(); }} />
          ) : (
            <OpsBansTab
              operators={opsList}
              bans={bansList}
              isLoading={false}
              onOpenAddOpModal={() =>
                setAddModalConfig({
                  isOpen: true,
                  type: "op",
                  title: "Add Server Operator",
                  buttonText: "Promote to OP",
                })
              }
              onRequestDeop={(name) => {
                setConfirmModalConfig({
                  isOpen: true,
                  actionType: "deop",
                  targetName: name,
                  title: `Demote ${name}?`,
                  message: "Remove operator privileges from this player.",
                  confirmText: "Demote",
                  confirmVariant: "warning",
                });
              }}
              onOpenBanModal={() => setBanModalConfig({ isOpen: true, initialName: "" })}
              onRequestUnban={(name) => {
                setConfirmModalConfig({
                  isOpen: true,
                  actionType: "unban",
                  targetName: name,
                  title: `Unban ${name}?`,
                  message: "Permit this player to reconnect to the server.",
                  confirmText: "Unban Player",
                  confirmVariant: "warning",
                });
              }}
            />
          )
        )}
      </div>

      <PlayerActionSheet
        player={selectedPlayer}
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onViewDetails={(p) => {
          setSelectedPlayer(p);
          setDetailsSheetOpen(true);
        }}
        onToggleOp={(p) => executeSetOp(p.name, p.op ? 0 : 4)}
        onKick={(p) => executeKick(p.name)}
        onBan={(p) => setBanModalConfig({ isOpen: true, initialName: p.name })}
        onCopyName={(n) => handleCopy(n, "Username copied!")}
      />

      <PlayerDetailsSheet
        player={selectedPlayer}
        isOpen={detailsSheetOpen}
        onClose={() => setDetailsSheetOpen(false)}
        onAction={async (name, action) => {
          await api.playerAction(name, action);
          showToast?.(`Action ${action} executed`, "success");
          rOnline();
        }}
        onCopy={handleCopy}
      />

      <AddPlayerModal
        isOpen={addModalConfig.isOpen}
        title={addModalConfig.title}
        buttonText={addModalConfig.buttonText}
        onClose={() => setAddModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onAdd={(name) => {
          if (addModalConfig.type === "whitelist") {
            handleAddWhitelistPlayer(name);
          } else {
            executeSetOp(name, 4);
            setAddModalConfig((prev) => ({ ...prev, isOpen: false }));
          }
        }}
      />

      <BanModal
        isOpen={banModalConfig.isOpen}
        initialName={banModalConfig.initialName}
        onClose={() => setBanModalConfig({ isOpen: false, initialName: "" })}
        onBan={executeBan}
      />

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        confirmVariant={confirmModalConfig.confirmVariant}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          const { actionType, targetName } = confirmModalConfig;
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
          if (actionType === "deop") executeSetOp(targetName, 0);
          if (actionType === "remove_whitelist") handleRemoveWhitelistPlayer(targetName);
          if (actionType === "unban") executeUnban(targetName);
        }}
      />
    </div>
  );
}
