import React, { useState, useEffect } from "react";
import { Download, AlertTriangle, Loader2 } from "lucide-react";
import Card from "../Card.jsx";
import { api } from "../../lib/api.js";

export default function PaperVersionSelector({ currentVersion, onApplyVersion }) {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(currentVersion?.version || "1.20.4");
  const [builds, setBuilds] = useState([]);
  const [selectedBuild, setSelectedBuild] = useState("");
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingBuilds, setLoadingBuilds] = useState(false);

  useEffect(() => {
    api.get("/api/versions/paper/versions")
      .then((res) => {
        if (res?.versions) {
          setVersions(res.versions);
          if (res.versions.length > 0 && !res.versions.includes(selectedVersion)) {
            setSelectedVersion(res.versions[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVersions(false));
  }, []);

  useEffect(() => {
    if (!selectedVersion) return;
    setLoadingBuilds(true);
    api.get(`/api/versions/paper/builds/${encodeURIComponent(selectedVersion)}`)
      .then((res) => {
        if (res?.builds) {
          setBuilds(res.builds);
          if (res.builds.length > 0) {
            setSelectedBuild(String(res.builds[0].build));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBuilds(false));
  }, [selectedVersion]);

  return (
    <Card className="mb-3 select-none">
      <h3 className="text-[14px] font-semibold text-[#e5e7eb] mb-3">
        Change Paper Version
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-[11.5px] font-medium text-[#9ca3af] mb-1">
            Paper Version
          </label>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            disabled={loadingVersions}
            className="w-full h-[40px] px-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] text-[#e5e7eb] text-[13px] outline-none focus:border-[#4ade80]"
          >
            {loadingVersions ? (
              <option>Loading versions...</option>
            ) : (
              versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-[11.5px] font-medium text-[#9ca3af] mb-1">
            Build
          </label>
          <select
            value={selectedBuild}
            onChange={(e) => setSelectedBuild(e.target.value)}
            disabled={loadingBuilds}
            className="w-full h-[40px] px-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] text-[#e5e7eb] text-[13px] outline-none focus:border-[#4ade80]"
          >
            {loadingBuilds ? (
              <option>Loading builds...</option>
            ) : (
              builds.map((b) => (
                <option key={b.build} value={b.build}>
                  Build #{b.build} ({new Date(b.time).toLocaleDateString()}) {b.build === builds[0]?.build ? "· Latest" : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="p-3 rounded-[8px] bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-start gap-2.5 text-[#fbbf24] text-[12px]">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="leading-snug">
            Server will restart. An automatic world backup will be created before updating. Your world may need regeneration if upgrading across major versions.
          </p>
        </div>

        <button
          type="button"
          disabled={!selectedVersion || !selectedBuild}
          onClick={() => onApplyVersion(selectedVersion, selectedBuild)}
          className="w-full h-[42px] rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
        >
          <Download size={16} />
          <span>Apply Version & Download</span>
        </button>
      </div>
    </Card>
  );
}
