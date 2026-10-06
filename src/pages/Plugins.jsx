import React, { useState, useMemo } from "react";
import { Search, X, SlidersHorizontal, RotateCw, Plus, Loader2, Check } from "lucide-react";
import Card from "../components/Card.jsx";
import BottomSheet from "../components/BottomSheet.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PluginList from "../components/plugins/PluginList.jsx";
import PluginDetailsSheet from "../components/plugins/PluginDetailsSheet.jsx";
import UploadSheet from "../components/plugins/UploadSheet.jsx";
import InstallUrlSheet from "../components/plugins/InstallUrlSheet.jsx";
import PluginStoreSheet from "../components/plugins/PluginStoreSheet.jsx";
import UpdatesSheet from "../components/plugins/UpdatesSheet.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

export default function Plugins({ showToast }) {
  const { data: plugins, loading, error, refetch } = useFetch("/api/plugins");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [installUrlSheetOpen, setInstallUrlSheetOpen] = useState(false);
  const [storeSheetOpen, setStoreSheetOpen] = useState(false);
  const [updatesSheetOpen, setUpdatesSheetOpen] = useState(false);
  const [isReloadingAll, setIsReloadingAll] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    action: null,
    target: null,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
  });

  const list = useMemo(() => {
    return Array.isArray(plugins) ? plugins : plugins?.list || [];
  }, [plugins]);

  const totalCount = list.length;
  const enabledCount = list.filter((p) => p.enabled).length;
  const updatesCount = list.filter((p) => p.updateAvailable).length;

  const displayedPlugins = useMemo(() => {
    let result = list;

    if (filterMode === "enabled") {
      result = result.filter((p) => p.enabled);
    } else if (filterMode === "disabled") {
      result = result.filter((p) => !p.enabled);
    } else if (filterMode === "updates") {
      result = result.filter((p) => p.updateAvailable);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [list, filterMode, searchQuery]);

  const handleTogglePlugin = async (plugin, newEnabled) => {
    try {
      await api.togglePlugin(plugin.id, newEnabled);
      showToast?.(`${plugin.name} ${newEnabled ? "enabled" : "disabled"}`, "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Failed to toggle plugin", "error");
    }
  };

  const handleUpdatePlugin = async (plugin) => {
    try {
      await api.updatePlugin(plugin.id);
      showToast?.(`Updated ${plugin.name}`, "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Update failed", "error");
    }
  };

  const executeUninstall = async (plugin) => {
    try {
      await api.deletePlugin(plugin.id);
      showToast?.(`Uninstalled ${plugin.name}`, "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Uninstall failed", "error");
    }
  };

  const executeReloadAll = async () => {
    setIsReloadingAll(true);
    try {
      await api.reloadAllPlugins();
      showToast?.("All plugins reloaded successfully", "success");
      refetch();
    } catch (err) {
      showToast?.(err.message || "Failed to reload plugins", "error");
    } finally {
      setIsReloadingAll(false);
    }
  };

  return (
    <div className="space-y-3 pb-[80px] select-none relative min-h-[calc(100vh-140px)]">
      {/* Search & Filter Header */}
      <div className="sticky top-[52px] z-30 bg-[#0f1115] pt-1 pb-2 -mt-1">
        <div className="h-[48px] px-1 flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search size={16} className="absolute left-3 text-[#6b7280] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins..."
              className="w-full h-[36px] pl-9 pr-8 rounded-[8px] bg-[#1a1d24] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] placeholder-[#6b7280] text-[13px] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-1 text-[#9ca3af] hover:text-[#e5e7eb] rounded-[4px]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className="w-[36px] h-[36px] rounded-[8px] bg-[#1a1d24] hover:bg-[#262a33] border border-[#262a33] flex items-center justify-center text-[#9ca3af] hover:text-[#e5e7eb] shrink-0"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-3 relative">
        <button
          type="button"
          disabled={isReloadingAll}
          onClick={() =>
            setConfirmConfig({
              isOpen: true,
              action: "reload_all",
              target: null,
              title: "Reload all plugins?",
              message: "Some plugins may cause a brief lag spike during reload.",
              confirmText: "Reload All",
              confirmVariant: "warning",
            })
          }
          className="absolute top-2.5 right-2.5 p-1.5 text-[#9ca3af] hover:text-[#4ade80] rounded-[6px]"
          title="Reload all plugins"
        >
          {isReloadingAll ? (
            <Loader2 size={16} className="animate-spin text-[#4ade80]" />
          ) : (
            <RotateCw size={16} />
          )}
        </button>

        <div className="grid grid-cols-3 gap-2 text-center py-0.5 pr-6">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[16px] font-semibold text-[#e5e7eb]">
              {loading ? "—" : totalCount}
            </span>
            <span className="text-[11px] text-[#9ca3af] mt-0.5">plugins</span>
          </div>

          <div className="flex flex-col items-center justify-center border-x border-[#262a33]">
            <span className="text-[16px] font-semibold text-[#e5e7eb]">
              {loading ? "—" : enabledCount}
            </span>
            <span className="text-[11px] text-[#9ca3af] mt-0.5">enabled</span>
          </div>

          <div
            onClick={() => updatesCount > 0 && setUpdatesSheetOpen(true)}
            className={`flex flex-col items-center justify-center ${updatesCount > 0 ? "cursor-pointer" : ""}`}
          >
            <span className={`text-[16px] font-semibold ${updatesCount > 0 ? "text-[#4ade80]" : "text-[#e5e7eb]"}`}>
              {loading ? "—" : updatesCount}
            </span>
            <span className={`text-[11px] mt-0.5 ${updatesCount > 0 ? "text-[#4ade80]" : "text-[#9ca3af]"}`}>
              updates
            </span>
          </div>
        </div>
      </Card>

      {/* Main List / States */}
      {loading ? (
        <div className="space-y-2">
          <SkeletonCard rows={2} height="h-24" />
          <SkeletonCard rows={2} height="h-24" />
          <SkeletonCard rows={2} height="h-24" />
        </div>
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No plugins installed"
          subtitle="Tap + below to upload or install plugins"
        />
      ) : (
        <PluginList
          plugins={displayedPlugins}
          isLoading={false}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
          onOpenDetails={(p) => {
            setSelectedPlugin(p);
            setDetailsSheetOpen(true);
          }}
          onToggleEnabled={handleTogglePlugin}
        />
      )}

      {/* FAB */}
      <div className="fixed bottom-[72px] left-0 right-0 max-w-[480px] mx-auto pointer-events-none px-4 flex justify-end z-30">
        <button
          type="button"
          onClick={() => setUploadSheetOpen(true)}
          className="pointer-events-auto w-[56px] h-[56px] rounded-full bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] shadow-2xl flex items-center justify-center cursor-pointer"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {/* Sheets & Modals */}
      <PluginDetailsSheet
        plugin={selectedPlugin}
        isOpen={detailsSheetOpen}
        onClose={() => setDetailsSheetOpen(false)}
        onToggleEnabled={handleTogglePlugin}
        onUpdate={handleUpdatePlugin}
        onRequestUninstall={(p) =>
          setConfirmConfig({
            isOpen: true,
            action: "uninstall",
            target: p,
            title: `Delete ${p.name}?`,
            message: "This .jar file will be removed from disk.",
            confirmText: "Delete",
            confirmVariant: "danger",
          })
        }
      />

      <UploadSheet
        isOpen={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        onOpenInstallUrl={() => setInstallUrlSheetOpen(true)}
        onOpenStore={() => setStoreSheetOpen(true)}
        onSuccessUpload={() => refetch()}
        showToast={showToast}
      />

      <InstallUrlSheet
        isOpen={installUrlSheetOpen}
        onClose={() => setInstallUrlSheetOpen(false)}
        onSuccessInstall={() => refetch()}
        showToast={showToast}
      />

      <PluginStoreSheet
        isOpen={storeSheetOpen}
        onClose={() => setStoreSheetOpen(false)}
        installedPlugins={list}
        onSuccessInstall={() => refetch()}
        showToast={showToast}
      />

      <UpdatesSheet
        isOpen={updatesSheetOpen}
        onClose={() => setUpdatesSheetOpen(false)}
        plugins={list}
        onSuccessUpdate={() => refetch()}
        showToast={showToast}
      />

      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter Plugins"
      >
        <div className="space-y-2">
          {[
            { id: "all", label: "Show all plugins" },
            { id: "enabled", label: "Show only enabled" },
            { id: "disabled", label: "Show only disabled" },
            { id: "updates", label: "Show only updates" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilterMode(item.id);
                setFilterSheetOpen(false);
              }}
              className={`w-full p-3 rounded-[8px] border text-left flex items-center justify-between text-[13px] font-medium ${
                filterMode === item.id
                  ? "bg-[#262a33] border-[#4ade80] text-[#4ade80]"
                  : "bg-[#0f1115] border-[#262a33] text-[#e5e7eb]"
              }`}
            >
              <span>{item.label}</span>
              {filterMode === item.id && <Check size={16} className="text-[#4ade80]" />}
            </button>
          ))}
        </div>
      </BottomSheet>

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
          if (action === "reload_all") executeReloadAll();
          if (action === "uninstall" && target) executeUninstall(target);
        }}
      />
    </div>
  );
}
