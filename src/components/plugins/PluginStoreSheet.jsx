import React, { useState } from 'react';
import { ShoppingBag, Check, Loader2 } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import PluginIcon from './PluginIcon.jsx';
import { CURATED_PLUGIN_STORE } from '../../lib/pluginStore.js';
import { api } from '../../lib/api.js';

export default function PluginStoreSheet({
  isOpen,
  onClose,
  installedPlugins = [],
  onSuccessInstall,
  showToast,
}) {
  const [installingId, setInstallingId] = useState(null);

  if (!isOpen) return null;

  const handleInstall = async (plugin) => {
    setInstallingId(plugin.id);
    try {
      await api.installPluginFromStore(plugin.id);
      showToast?.(`Installed ${plugin.name} from Store`, 'success');
      setInstallingId(null);
      onSuccessInstall();
    } catch (err) {
      showToast?.(err.message || `Failed to install ${plugin.name}`, 'error');
      setInstallingId(null);
    }
  };

  const isAlreadyInstalled = (storeId, storeName) => {
    return installedPlugins.some(
      (p) =>
        p.id?.toLowerCase() === storeId?.toLowerCase() ||
        p.name?.toLowerCase().includes(storeName?.toLowerCase())
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Curated Plugin Store">
      <div className="space-y-3">
        <p className="text-[12px] text-[#9ca3af]">
          Popular, battle-tested Minecraft plugins tested for Railway deployment.
        </p>

        <div className="space-y-2">
          {CURATED_PLUGIN_STORE.map((plugin) => {
            const installed = isAlreadyInstalled(plugin.id, plugin.name);
            const isBusy = installingId === plugin.id;

            return (
              <div
                key={plugin.id}
                className="p-3 rounded-[10px] bg-[#0f1115] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PluginIcon name={plugin.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-[#e5e7eb] truncate">
                        {plugin.name}
                      </span>
                      <span className="text-[11px] text-[#6b7280]">
                        {plugin.version}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#9ca3af] line-clamp-1 mt-0.5">
                      {plugin.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {installed ? (
                    <button
                      type="button"
                      disabled
                      className="h-[32px] px-3 rounded-[6px] bg-[#262a33] text-[#9ca3af] text-[12px] font-medium flex items-center gap-1 cursor-default"
                    >
                      <Check size={14} className="text-[#4ade80]" />
                      <span>Installed</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleInstall(plugin)}
                      className="h-[32px] px-3 rounded-[6px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] font-semibold text-[12px] flex items-center gap-1 transition-colors duration-150 cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <ShoppingBag size={13} />
                      )}
                      <span>Install</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
