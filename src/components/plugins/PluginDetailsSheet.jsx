import React, { useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  Power,
  Copy,
} from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import PluginIcon from './PluginIcon.jsx';

/**
 * Detailed plugin inspection and actions bottom sheet
 */
export default function PluginDetailsSheet({
  plugin,
  isOpen,
  onClose,
  onToggleEnabled,
  onUpdate,
  onReload,
  onRequestResetConfig,
  onRequestUninstall,
  onCopyText,
}) {
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);

  if (!plugin) return null;

  const isEnabled = Boolean(plugin.enabled);
  const commands = Array.isArray(plugin.commands) ? plugin.commands : [];
  const permissions = Array.isArray(plugin.permissions) ? plugin.permissions : [];
  const dependencies = Array.isArray(plugin.dependencies) && plugin.dependencies.length > 0
    ? plugin.dependencies.join(', ')
    : 'None';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Plugin Information">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3.5 p-3 rounded-[10px] bg-[#0f1115] border border-[#262a33]">
          <PluginIcon name={plugin.name} size={56} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold text-[#e5e7eb] truncate">
              {plugin.name}
            </h3>
            <p className="text-[12px] text-[#9ca3af] truncate mt-0.5">
              {plugin.version || 'v1.0.0'} · {plugin.size || 'Unknown size'}
            </p>
            {plugin.updateAvailable && (
              <span className="inline-block mt-1 bg-[#4ade80]/15 text-[#4ade80] text-[10px] font-semibold px-2 py-0.5 rounded-[4px]">
                Update to {plugin.updateVersion || 'new version'} available
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <span className="text-[#9ca3af] block text-[11px]">Author</span>
            <span className="text-[#e5e7eb] font-medium text-[13px] truncate block mt-0.5">
              {plugin.author || 'Unknown'}
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <span className="text-[#9ca3af] block text-[11px]">Load Order</span>
            <span className="text-[#e5e7eb] font-medium text-[13px] truncate block mt-0.5">
              {plugin.loadOrder || 'NORMAL'}
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <span className="text-[#9ca3af] block text-[11px]">Installed</span>
            <span className="text-[#e5e7eb] font-medium text-[13px] truncate block mt-0.5">
              {plugin.installedAt || 'Recently'}
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <span className="text-[#9ca3af] block text-[11px]">Last Updated</span>
            <span className="text-[#e5e7eb] font-medium text-[13px] truncate block mt-0.5">
              {plugin.updatedAt || 'Recently'}
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <span className="text-[#9ca3af] block text-[11px]">API Version</span>
            <span className="text-[#e5e7eb] font-medium text-[13px] truncate block mt-0.5">
              {plugin.apiVersion || 'Any'}
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <span className="text-[#9ca3af] block text-[11px]">Dependencies</span>
            <span className="text-[#e5e7eb] font-medium text-[13px] truncate block mt-0.5">
              {dependencies}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-3 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
          <h4 className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">
            Description
          </h4>
          <p className="text-[13px] text-[#9ca3af] leading-relaxed">
            {plugin.description || 'No description provided.'}
          </p>
        </div>

        {/* Commands (Chips Row) */}
        {commands.length > 0 && (
          <div className="p-3 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <h4 className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">
              Commands ({commands.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {commands.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => onCopyText(cmd, `Copied ${cmd}`)}
                  className="px-2 py-1 rounded-[6px] bg-[#1a1d24] hover:bg-[#262a33] border border-[#262a33] text-[11px] font-mono text-[#4ade80] flex items-center gap-1 cursor-pointer transition-colors duration-150"
                  title="Click to copy command"
                >
                  <span>{cmd}</span>
                  <Copy size={10} className="text-[#9ca3af]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Collapsible */}
        {permissions.length > 0 && (
          <div className="p-3 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
            <button
              type="button"
              onClick={() => setPermissionsExpanded(!permissionsExpanded)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <h4 className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Permissions ({permissions.length})
              </h4>
              {permissionsExpanded ? (
                <ChevronUp size={16} className="text-[#9ca3af]" />
              ) : (
                <ChevronDown size={16} className="text-[#9ca3af]" />
              )}
            </button>
            {permissionsExpanded && (
              <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                {permissions.map((perm) => (
                  <div
                    key={perm}
                    onClick={() => onCopyText(perm, `Copied ${perm}`)}
                    className="font-mono text-[11px] text-[#e5e7eb] bg-[#1a1d24] px-2 py-1 rounded-[4px] truncate cursor-pointer hover:text-[#4ade80]"
                  >
                    {perm}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stacked Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* 1. Toggle Enable / Disable */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleEnabled(plugin, !isEnabled);
            }}
            className={`
              w-full min-h-[44px] rounded-[8px] font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer
              ${isEnabled ? 'bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb]' : 'bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115]'}
            `}
          >
            <Power size={16} />
            <span>{isEnabled ? 'Disable Plugin' : 'Enable Plugin'}</span>
          </button>

          {/* 2. Update (if available) */}
          {plugin.updateAvailable && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onUpdate(plugin);
              }}
              className="w-full min-h-[44px] rounded-[8px] border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10 font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
            >
              <DownloadCloud size={16} />
              <span>Update to {plugin.updateVersion || 'Latest'}</span>
            </button>
          )}

          {/* 3. Reload This Plugin */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onReload(plugin);
            }}
            className="w-full min-h-[44px] rounded-[8px] bg-[#1a1d24] hover:bg-[#262a33] border border-[#262a33] text-[#e5e7eb] font-medium text-[13px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <RotateCw size={16} className="text-[#60a5fa]" />
            <span>Reload Configuration</span>
          </button>

          {/* 4. Reset Config */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestResetConfig(plugin);
            }}
            className="w-full min-h-[44px] rounded-[8px] bg-[#1a1d24] hover:bg-[#262a33] border border-[#262a33] text-[#fbbf24] font-medium text-[13px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Reset Config to Defaults</span>
          </button>

          {/* 5. Uninstall */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestUninstall(plugin);
            }}
            className="w-full min-h-[44px] rounded-[8px] bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] font-medium text-[13px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Uninstall & Delete</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
