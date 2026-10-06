import React, { useState } from "react";
import { Archive } from "lucide-react";
import StorageCard from "../components/backups/StorageCard.jsx";
import AutoBackupCard from "../components/backups/AutoBackupCard.jsx";
import BackupList from "../components/backups/BackupList.jsx";
import BackupActionsSheet from "../components/backups/BackupActionsSheet.jsx";
import CreateBackupModal from "../components/backups/CreateBackupModal.jsx";
import CleanupSheet from "../components/backups/CleanupSheet.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

export default function Backups({ showToast }) {
  const { data, loading, error, refetch } = useFetch("/api/backups");

  const [currentSort, setCurrentSort] = useState("newest");
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cleanupSheetOpen, setCleanupSheetOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState("");

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    action: null,
    target: null,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
  });

  const list = data?.list || [];
  const storage = data?.storage || { used: null, total: null };
  const autoConfig = data?.auto || { enabled: false, frequency: "Daily", time: "03:00", keep: 5 };

  const handleCreateBackup = async (customName) => {
    setCreateModalOpen(false);
    try {
      showToast?.("Creating backup...", "success");
      await api.createBackup(customName);
      showToast?.("Backup created successfully", "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Failed to create backup", "error");
    }
  };

  const handleRestoreBackup = async (backup) => {
    try {
      showToast?.(`Restoring ${backup.name}...`, "success");
      await api.restoreBackup(backup.id);
      showToast?.(`World restored from ${backup.name}`, "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Failed to restore backup", "error");
    }
  };

  const handleSaveRename = async () => {
    if (!selectedBackup || !renameInput.trim()) return;
    const newName = renameInput.trim();
    setRenameModalOpen(false);
    try {
      await api.renameBackup(selectedBackup.id, newName);
      showToast?.(`Renamed to "${newName}"`, "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Rename failed", "error");
    }
  };

  const executeDelete = async (backup) => {
    try {
      await api.deleteBackup(backup.id);
      showToast?.(`Deleted ${backup.name}`, "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Failed to delete backup", "error");
    }
  };

  const handleAutoBackupChange = async (newConfig) => {
    try {
      await api.updateAutoBackup(newConfig);
      showToast?.("Auto-backup config updated", "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Failed to update auto-backup", "error");
    }
  };

  return (
    <div className="space-y-3 pb-[84px] select-none relative min-h-[calc(100vh-140px)]">
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard rows={2} height="h-28" />
          <SkeletonCard rows={3} height="h-32" />
        </div>
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : (
        <>
          <StorageCard
            storage={storage}
            backupCount={list.length}
            isRefreshing={false}
            onRefresh={refetch}
          />

          <AutoBackupCard
            config={autoConfig}
            onChange={handleAutoBackupChange}
          />

          <BackupList
            backups={list}
            isLoading={false}
            currentSort={currentSort}
            onCycleSort={setCurrentSort}
            onOpenActions={(b) => {
              setSelectedBackup(b);
              setActionsSheetOpen(true);
            }}
            onOpenCleanup={() => setCleanupSheetOpen(true)}
            onRequestCreate={() => setCreateModalOpen(true)}
          />
        </>
      )}

      {/* FAB */}
      <div className="fixed bottom-[72px] left-0 right-0 max-w-[480px] mx-auto pointer-events-none px-4 flex justify-end z-30">
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="pointer-events-auto w-[56px] h-[56px] rounded-full bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] shadow-2xl flex items-center justify-center cursor-pointer"
        >
          <Archive size={24} strokeWidth={2.2} />
        </button>
      </div>

      <BackupActionsSheet
        backup={selectedBackup}
        isOpen={actionsSheetOpen}
        onClose={() => setActionsSheetOpen(false)}
        onRequestRestore={(b) => {
          setConfirmConfig({
            isOpen: true,
            action: "restore",
            target: b,
            title: `Restore ${b.name}?`,
            message: "Current world will be replaced. Ensure server is stopped.",
            confirmText: "Restore",
            confirmVariant: "warning",
          });
        }}
        onRequestRename={(b) => {
          setSelectedBackup(b);
          setRenameInput(b.name);
          setRenameModalOpen(true);
        }}
        onRequestDelete={(b) => {
          setConfirmConfig({
            isOpen: true,
            action: "delete",
            target: b,
            title: `Delete ${b.name}?`,
            message: "This backup file will be permanently removed.",
            confirmText: "Delete",
            confirmVariant: "danger",
          });
        }}
      />

      <CreateBackupModal
        isOpen={createModalOpen}
        defaultName={`Backup #${list.length + 1}`}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateBackup}
      />

      <CleanupSheet
        isOpen={cleanupSheetOpen}
        onClose={() => setCleanupSheetOpen(false)}
        onRequestBulkDelete={async (filterKey) => {
          await api.bulkDeleteBackups(filterKey);
          showToast?.("Cleaned up old backups", "success");
          refetch();
        }}
      />

      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
          <div className="w-full max-w-[340px] bg-[#1a1d24] border border-[#262a33] rounded-[12px] p-[16px] shadow-2xl select-none">
            <h3 className="text-[15px] font-semibold text-[#e5e7eb] mb-3">
              Rename Backup
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRename();
              }}
              className="space-y-3"
            >
              <input
                type="text"
                autoFocus
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full h-[38px] px-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] text-[13px] outline-none"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] font-medium text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renameInput.trim()}
                  className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] font-semibold text-[13px] disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmVariant={confirmConfig.confirmVariant}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          const { action, target } = confirmConfig;
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          if (action === "restore" && target) handleRestoreBackup(target);
          if (action === "delete" && target) executeDelete(target);
        }}
      />
    </div>
  );
}
