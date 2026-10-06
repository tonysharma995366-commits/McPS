import React, { useState } from "react";
import { Globe, CheckCircle2, Copy, Check, Trash2, RefreshCw, Loader2, Sparkles } from "lucide-react";
import Card from "../Card.jsx";
import { api } from "../../lib/api.js";

export default function GeyserCard({ geyser, onRefresh, showToast }) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [portInput, setPortInput] = useState(geyser?.bedrockPort || 19132);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const installed = geyser?.installed;
  const floodgateInstalled = geyser?.floodgateInstalled;
  const bedrockAddress = geyser?.bedrockAddress;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await api.post("/api/versions/geyser/install");
      showToast?.("Geyser & Floodgate installed. Restart required.", "success");
      onRefresh?.();
    } catch (err) {
      showToast?.(err.message || "Failed to install Geyser", "error");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstall = async () => {
    setIsUninstalling(true);
    try {
      await api.post("/api/versions/geyser/uninstall");
      showToast?.("Geyser uninstalled. Restart required.", "success");
      onRefresh?.();
    } catch (err) {
      showToast?.(err.message || "Failed to uninstall Geyser", "error");
    } finally {
      setIsUninstalling(false);
    }
  };

  const handleUpdateConfig = async () => {
    setIsUpdating(true);
    try {
      await api.post("/api/versions/geyser/config", { bedrockPort: Number(portInput) });
      showToast?.("Geyser config updated", "success");
      onRefresh?.();
    } catch (err) {
      showToast?.(err.message || "Failed to update config", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddr(true);
      showToast?.("Bedrock address copied!", "success");
      setTimeout(() => setCopiedAddr(false), 2000);
    } catch {
      showToast?.("Failed to copy", "error");
    }
  };

  return (
    <Card className="mb-3 select-none">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-[10px] bg-[#60a5fa]/15 flex items-center justify-center shrink-0">
          <Globe size={20} className="text-[#60a5fa]" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[#e5e7eb]">
            Bedrock Support (Geyser)
          </h3>
          <p className="text-[11.5px] text-[#9ca3af] mt-0.5">
            Allow Minecraft Pocket Edition / Bedrock players (v{geyser?.bedrockVersion || "1.26.52.3"}) to join
          </p>
        </div>
      </div>

      {!installed ? (
        <div className="pt-2">
          <button
            type="button"
            disabled={isInstalling}
            onClick={handleInstall}
            className="w-full h-[42px] rounded-[8px] bg-[#60a5fa] hover:bg-[#3b82f6] text-[#0f1115] text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            {isInstalling ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Install Geyser + Floodgate</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-1 text-[12.5px]">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33] flex items-center justify-between">
              <span className="text-[#9ca3af]">Geyser</span>
              <span className="text-[#4ade80] font-medium flex items-center gap-1">
                <CheckCircle2 size={14} /> Installed
              </span>
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33] flex items-center justify-between">
              <span className="text-[#9ca3af]">Floodgate</span>
              <span className={floodgateInstalled ? "text-[#4ade80] font-medium flex items-center gap-1" : "text-[#fbbf24]"}>
                {floodgateInstalled ? "✓ Installed" : "Optional"}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33] flex items-center justify-between">
            <span className="text-[#9ca3af]">Pocket Edition Support</span>
            <span className="text-[#60a5fa] font-mono font-medium">
              v{geyser?.bedrockVersion || "1.26.52.3"}
            </span>
          </div>

          <div>
            <label className="block text-[11.5px] font-medium text-[#9ca3af] mb-1">
              Bedrock Port
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                className="flex-1 h-[36px] px-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] text-[#e5e7eb] font-mono text-[13px] outline-none focus:border-[#60a5fa]"
              />
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateConfig}
                className="h-[36px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[12px] font-medium transition-colors cursor-pointer"
              >
                {isUpdating ? "Saving..." : "Save Port"}
              </button>
            </div>
          </div>

          {bedrockAddress && (
            <div>
              <label className="block text-[11.5px] font-medium text-[#9ca3af] mb-1">
                Bedrock Public Address
              </label>
              <div
                onClick={() => handleCopy(bedrockAddress)}
                className="p-2.5 rounded-[8px] bg-[#0a0c10] border border-[#262a33] hover:border-[#60a5fa]/50 font-mono text-[12px] text-[#e5e7eb] flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{bedrockAddress}</span>
                {copiedAddr ? <Check size={14} className="text-[#4ade80]" /> : <Copy size={14} className="text-[#9ca3af]" />}
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isUninstalling}
              onClick={handleUninstall}
              className="h-[36px] px-3 rounded-[8px] bg-[#ef4444]/15 hover:bg-[#ef4444]/25 text-[#ef4444] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Uninstall Geyser</span>
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-[#6b7280] mt-3 leading-relaxed">
        After installing, Bedrock players can join using the Bedrock address above. Java players continue using the standard Java address from the About page.
      </p>
    </Card>
  );
}
