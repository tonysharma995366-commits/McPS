import React, { useState } from "react";
import CurrentVersionCard from "../components/versions/CurrentVersionCard.jsx";
import PaperVersionSelector from "../components/versions/PaperVersionSelector.jsx";
import GeyserCard from "../components/versions/GeyserCard.jsx";
import RestartBanner from "../components/versions/RestartBanner.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

export default function Versions({ showToast }) {
  const { data, loading, error, refetch } = useFetch("/api/versions");
  const [restartNeeded, setRestartNeeded] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    version: "",
    build: "",
  });

  const handleApplyClick = (version, build) => {
    setConfirmConfig({
      isOpen: true,
      version,
      build,
    });
  };

  const handleConfirmSetVersion = async () => {
    const { version, build } = confirmConfig;
    setConfirmConfig({ isOpen: false, version: "", build: "" });
    try {
      showToast?.(`Downloading Paper ${version} build ${build}...`, "success");
      await api.post("/api/versions/paper/set", { version, build });
      showToast?.("Paper server jar updated successfully!", "success");
      setRestartNeeded(true);
      refetch();
    } catch (err) {
      showToast?.(err.message || "Failed to update Paper version", "error");
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-3 pb-[80px]">
        <SkeletonCard rows={3} height="h-32" />
        <SkeletonCard rows={4} height="h-44" />
      </div>
    );
  }

  if (error && !data) {
    return <ErrorCard message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-3 pb-[84px] select-none relative min-h-[calc(100vh-140px)]">
      {restartNeeded && (
        <RestartBanner showToast={showToast} onRestarted={() => setRestartNeeded(false)} />
      )}

      <CurrentVersionCard current={data?.current} updates={data?.updates} />

      <PaperVersionSelector
        currentVersion={data?.current}
        onApplyVersion={handleApplyClick}
      />

      <GeyserCard
        geyser={data?.geyser}
        onRefresh={() => {
          setRestartNeeded(true);
          refetch();
        }}
        showToast={showToast}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={`Change to Paper ${confirmConfig.version} build ${confirmConfig.build}?`}
        message="An automatic world backup will be created. The server will need to be restarted to apply the new jar."
        confirmText="Apply & Download"
        confirmVariant="warning"
        onCancel={() => setConfirmConfig({ isOpen: false, version: "", build: "" })}
        onConfirm={handleConfirmSetVersion}
      />
    </div>
  );
}
