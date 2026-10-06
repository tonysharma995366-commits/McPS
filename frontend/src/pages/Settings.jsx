import React, { useState } from "react";
import WorldOverview from "../components/settings/WorldOverview.jsx";
import CollapsibleSection from "../components/settings/CollapsibleSection.jsx";
import WorldActions from "../components/settings/WorldActions.jsx";
import GameRulesSection from "../components/settings/GameRulesSection.jsx";
import ServerPropertiesSection from "../components/settings/ServerPropertiesSection.jsx";
import DifficultySection from "../components/settings/DifficultySection.jsx";
import DangerZoneSection from "../components/settings/DangerZoneSection.jsx";
import RegenerateModal from "../components/settings/RegenerateModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

export default function Settings({ showToast }) {
  const [openSections, setOpenSections] = useState({
    worldActions: true,
    gameRules: false,
    serverProperties: false,
    difficulty: false,
    dangerZone: false,
  });

  const { data: world, loading: l1, error: e1, refetch: r1 } = useFetch("/api/world");
  const { data: props, loading: l2, error: e2, refetch: r2 } = useFetch("/api/properties");
  const { data: rules, loading: l3, error: e3, refetch: r3 } = useFetch("/api/world/gamerules");

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSavingProps, setIsSavingProps] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    action: null,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    requireText: null,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
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

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await api.backupWorld();
      showToast?.("World backup created successfully", "success");
      r1();
    } catch (err) {
      showToast?.(err.message || "Failed to create backup", "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRegenerateWorld = async (seed, backup) => {
    setIsRegenerating(true);
    try {
      await api.regenerateWorld(seed, backup);
      showToast?.("World regenerated successfully", "success");
      setRegenerateModalOpen(false);
      r1();
    } catch (err) {
      showToast?.(err.message || "World regeneration failed", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleGameRule = async (rule, value) => {
    try {
      await api.setGameRule(rule, value);
      showToast?.(`Rule '${rule}' set to ${value}`, "success");
      r3();
    } catch (err) {
      showToast?.(err.message || "Failed to apply game rule", "error");
    }
  };

  const handleSaveProperties = async (newProps) => {
    setIsSavingProps(true);
    try {
      await api.updateServerProperties(newProps);
      showToast?.("Properties saved. Restart required to apply.", "success");
      r2();
    } catch (err) {
      showToast?.(err.message || "Failed to save properties", "error");
    } finally {
      setIsSavingProps(false);
    }
  };

  const executeResetProperties = async () => {
    try {
      await api.resetServerProperties();
      showToast?.("Server properties restored to defaults", "success");
      r2();
    } catch (err) {
      showToast?.(err.message || "Failed to reset properties", "error");
    }
  };

  const executeDeleteWorld = async () => {
    try {
      await api.deleteWorld();
      showToast?.("World deleted", "success");
      r1();
    } catch (err) {
      showToast?.(err.message || "Failed to delete world", "error");
    }
  };

  const executeWipeSystem = async () => {
    try {
      await api.wipeSystem();
      showToast?.("System wiped completely", "success");
      r1();
      r2();
      r3();
    } catch (err) {
      showToast?.(err.message || "System wipe failed", "error");
    }
  };

  const isLoading = l1 || l2 || l3;
  const hasError = e1 || e2 || e3;

  return (
    <div className="space-y-3 pb-[84px] select-none">
      {isLoading ? (
        <SkeletonCard rows={3} height="h-32" />
      ) : hasError ? (
        <ErrorCard message={e1 || e2 || e3} onRetry={() => { r1(); r2(); r3(); }} />
      ) : (
        <>
          <WorldOverview
            world={world || {}}
            isRefreshing={false}
            onRefresh={r1}
            onCopy={handleCopy}
          />

          <CollapsibleSection
            title="World Actions"
            isOpen={openSections.worldActions}
            onToggle={() => toggleSection("worldActions")}
          >
            <WorldActions
              onBackupNow={handleBackupNow}
              isBackingUp={isBackingUp}
              onRequestRegenerate={() => setRegenerateModalOpen(true)}
              showToast={showToast}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Game Rules"
            isOpen={openSections.gameRules}
            onToggle={() => toggleSection("gameRules")}
          >
            <GameRulesSection
              gameRules={rules || {}}
              onToggleRule={handleToggleGameRule}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Server Properties"
            isOpen={openSections.serverProperties}
            onToggle={() => toggleSection("serverProperties")}
          >
            <ServerPropertiesSection
              properties={props?.values || {}}
              livePort={props?.values?.["server-port"] || 25565}
              onSave={handleSaveProperties}
              isSaving={isSavingProps}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Difficulty & Gameplay"
            isOpen={openSections.difficulty}
            onToggle={() => toggleSection("difficulty")}
          >
            <DifficultySection
              properties={props?.values || {}}
              onChangeField={(k, v) => handleSaveProperties({ [k]: v })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Danger Zone"
            isOpen={openSections.dangerZone}
            onToggle={() => toggleSection("dangerZone")}
            danger
          >
            <DangerZoneSection
              onRequestResetProperties={() =>
                setConfirmConfig({
                  isOpen: true,
                  action: "reset_properties",
                  title: "Reset Properties?",
                  message: "Restore server.properties to factory defaults.",
                  confirmText: "Reset Properties",
                  confirmVariant: "danger",
                })
              }
              onRequestDeleteWorld={() =>
                setConfirmConfig({
                  isOpen: true,
                  action: "delete_world",
                  title: "Delete World?",
                  message: "Permanently delete current world folder.",
                  confirmText: "Delete World",
                  confirmVariant: "danger",
                })
              }
              onRequestWipeAll={() =>
                setConfirmConfig({
                  isOpen: true,
                  action: "wipe_all",
                  title: "Wipe Everything?",
                  message: "Delete world, plugins, and configs.",
                  confirmText: "Wipe Everything",
                  confirmVariant: "danger",
                })
              }
            />
          </CollapsibleSection>
        </>
      )}

      <RegenerateModal
        isOpen={regenerateModalOpen}
        currentSeed={world?.seed}
        onClose={() => setRegenerateModalOpen(false)}
        onRegenerate={handleRegenerateWorld}
        isBusy={isRegenerating}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmVariant={confirmConfig.confirmVariant}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          const act = confirmConfig.action;
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          if (act === "reset_properties") executeResetProperties();
          if (act === "delete_world") executeDeleteWorld();
          if (act === "wipe_all") executeWipeSystem();
        }}
      />
    </div>
  );
}
