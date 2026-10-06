import React, { useState } from 'react';
import { DownloadCloud, Check, Loader2 } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import PluginIcon from './PluginIcon.jsx';
import { api } from '../../lib/api.js';

export default function UpdatesSheet({
  isOpen,
  onClose,
  plugins = [],
  onSuccessUpdate,
  showToast,
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  if (!isOpen) return null;

  const updateList = plugins.filter((p) => p.updateAvailable);

  const handleUpdateSingle = async (plugin) => {
    setUpdatingId(plugin.id);
    try {
      await api.updatePlugin(plugin.id);
      showToast?.(`Updated ${plugin.name} to ${plugin.updateVersion || 'latest'}`, 'success');
      setUpdatingId(null);
      onSuccessUpdate();
    } catch (err) {
      showToast?.(err.message || `Failed to update ${plugin.name}`, 'error');
      setUpdatingId(null);
    }
  };

  const handleUpdateAll = async () => {
    setIsUpdatingAll(true);
    let succeeded = 0;
    for (const plugin of updateList) {
      try {
        await api.updatePlugin(plugin.id);
        succeeded++;
      } catch {
        // continue
      }
    }
    setIsUpdatingAll(false);
    showToast?.(`Updated ${succeeded} plugin(s)`, 'success');
    onSuccessUpdate();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Available Plugin Updates">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#9ca3af]">
            {updateList.length} plugin(s) have newer versions available.
          </p>
          {updateList.length > 0 && (
            <button
              type="button"
              disabled={isUpdatingAll}
              onClick={handleUpdateAll}
              className="text-[12px] font-semibold text-[#4ade80] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingAll ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Updating all...</span>
                </>
              ) : (
                <span>Update All</span>
              )}
            </button>
          )}
        </div>

        {updateList.length === 0 ? (
          <div className="p-6 text-center text-[#6b7280] text-[13px] bg-[#0f1115] rounded-[8px] border border-[#262a33]">
            All plugins are up to date!
          </div>
        ) : (
          <div className="space-y-2">
            {updateList.map((plugin) => {
              const isBusy = updatingId === plugin.id;

              return (
                <div
                  key={plugin.id}
                  className="p-3 rounded-[10px] bg-[#0f1115] border border-[#262a33] flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <PluginIcon name={plugin.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <span className="text-[13.5px] font-semibold text-[#e5e7eb] block truncate">
                        {plugin.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11.5px] mt-0.5">
                        <span className="text-[#9ca3af]">{plugin.version}</span>
                        <span className="text-[#6b7280]">→</span>
                        <span className="text-[#4ade80] font-semibold">
                          {plugin.updateVersion || 'Latest'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy || isUpdatingAll}
                    onClick={() => handleUpdateSingle(plugin)}
                    className="h-[32px] px-3 rounded-[6px] border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10 text-[12px] font-semibold flex items-center gap-1 transition-colors duration-150 cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <DownloadCloud size={13} />
                    )}
                    <span>Update</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
