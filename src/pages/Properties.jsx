import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropertiesSearch from "../components/properties/PropertiesSearch.jsx";
import CategorySection from "../components/properties/CategorySection.jsx";
import PropertyRow from "../components/properties/PropertyRow.jsx";
import RawEditor from "../components/properties/RawEditor.jsx";
import SaveBar from "../components/properties/SaveBar.jsx";
import DiffSheet from "../components/properties/DiffSheet.jsx";
import RestartBanner from "../components/properties/RestartBanner.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { CATEGORIES, RESTART_REQUIRED_KEYS, validateProperty } from "../lib/propertyMeta.js";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

export default function Properties({ showToast }) {
  const [activeMode, setActiveMode] = useState("form");
  const { data, loading, error, refetch } = useFetch("/api/properties");

  const [values, setValues] = useState({});
  const [savedValues, setSavedValues] = useState({});
  const [defaults, setDefaults] = useState({});
  const [rawText, setRawText] = useState("");
  const [savedRawText, setSavedRawText] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState({ network: true, gameplay: true });
  const [diffSheetOpen, setDiffSheetOpen] = useState(false);
  const [pendingRestartCount, setPendingRestartCount] = useState(0);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (data) {
      const serverValues = data.values || data.properties || {};
      const serverDefaults = data.defaults || {};
      const serverRaw = data.rawText || Object.entries(serverValues).map(([k, v]) => `${k}=${v}`).join("\n");

      setValues(serverValues);
      setSavedValues(serverValues);
      setDefaults(serverDefaults);
      setRawText(serverRaw);
      setSavedRawText(serverRaw);
    }
  }, [data]);

  const isFormDirty = useMemo(() => {
    return Object.keys(values).some((k) => values[k] !== savedValues[k]);
  }, [values, savedValues]);

  const isRawDirty = useMemo(() => rawText !== savedRawText, [rawText, savedRawText]);
  const isDirty = activeMode === "form" ? isFormDirty : isRawDirty;

  const handleValueChange = useCallback((key, nextVal) => {
    setValues((prev) => ({ ...prev, [key]: nextVal }));
  }, []);

  const diffList = useMemo(() => {
    const list = [];
    const allKeys = new Set([...Object.keys(values), ...Object.keys(savedValues)]);
    for (const key of allKeys) {
      const oldVal = savedValues[key] ?? "";
      const newVal = values[key] ?? "";
      if (oldVal !== newVal) {
        list.push({ key, oldValue: oldVal, newValue: newVal });
      }
    }
    return list;
  }, [values, savedValues]);

  const validationErrors = useMemo(() => {
    const errs = {};
    for (const [k, v] of Object.entries(values)) {
      const err = validateProperty(k, v);
      if (err) errs[k] = err;
    }
    return errs;
  }, [values]);

  const hasFormErrors = Object.keys(validationErrors).length > 0;

  const handleSave = async () => {
    if (isSaving) return;

    if (activeMode === "form") {
      if (hasFormErrors) {
        showToast?.("Resolve validation errors before saving", "error");
        return;
      }

      const changedKeys = {};
      let restartCount = 0;

      for (const [k, v] of Object.entries(values)) {
        if (v !== savedValues[k]) {
          changedKeys[k] = v;
          if (RESTART_REQUIRED_KEYS.has(k)) restartCount++;
        }
      }

      if (Object.keys(changedKeys).length === 0) return;

      setIsSaving(true);
      try {
        await api.updateServerProperties({ values: changedKeys });
        setSavedValues({ ...values });
        showToast?.("Properties saved", "success");
        if (restartCount > 0) setPendingRestartCount(restartCount);
        refetch();
      } catch (err) {
        showToast?.(err.message || "Failed to save properties", "error");
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSaving(true);
      try {
        await api.saveRawProperties(rawText);
        setSavedRawText(rawText);
        showToast?.("server.properties saved", "success");
        setPendingRestartCount(1);
        refetch();
      } catch (err) {
        showToast?.(err.message || "Failed to save raw properties", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-3 pb-[80px] select-none relative min-h-[calc(100vh-140px)]">
      <PropertiesSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        matchCount={Object.keys(values).length}
        totalCount={Object.keys(values).length}
      />

      <RestartBanner
        restartCount={pendingRestartCount}
        onRestartNow={async () => {
          await api.restartServer();
          setPendingRestartCount(0);
          showToast?.("Server restart initiated", "success");
        }}
        onDismiss={() => setPendingRestartCount(0)}
      />

      {loading ? (
        <div className="space-y-3 pt-2">
          <SkeletonCard rows={3} height="h-32" />
          <SkeletonCard rows={3} height="h-32" />
        </div>
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : activeMode === "form" ? (
        <div className="pt-1">
          {CATEGORIES.map((category) => {
            const isOpen = Boolean(openSections[category.id]);
            return (
              <CategorySection
                key={category.id}
                category={category}
                isOpen={isOpen}
                onToggle={() =>
                  setOpenSections((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
                }
                matchCount={category.keys.length}
                isSearching={Boolean(searchQuery)}
                hasModifiedProperties={false}
              >
                <div className="divide-y divide-[#262a33]/60">
                  {category.keys.map((key) => (
                    <PropertyRow
                      key={key}
                      propKey={key}
                      value={values[key]}
                      defaultValue={defaults[key]}
                      onChange={handleValueChange}
                      error={validationErrors[key]}
                    />
                  ))}
                </div>
              </CategorySection>
            );
          })}
        </div>
      ) : (
        <RawEditor
          rawText={rawText}
          onChange={setRawText}
          onReload={refetch}
          isDirty={isRawDirty}
          onCopy={(txt, label) => showToast?.(label, "success")}
        />
      )}

      {isDirty && (
        <SaveBar
          dirtyCount={diffList.length}
          onOpenDiff={() => setDiffSheetOpen(true)}
          onReset={() => setValues({ ...savedValues })}
          onSave={handleSave}
          isSaving={isSaving}
          hasErrors={hasFormErrors}
        />
      )}

      <DiffSheet
        isOpen={diffSheetOpen}
        onClose={() => setDiffSheetOpen(false)}
        diffList={diffList}
        onConfirmSave={handleSave}
        isSaving={isSaving}
      />

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
