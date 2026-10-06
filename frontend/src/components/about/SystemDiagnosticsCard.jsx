import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Stethoscope } from 'lucide-react';
import CollapsibleSection from '../settings/CollapsibleSection.jsx';

/**
 * System Diagnostics Card displaying a 2-column info grid of server and hardware metrics.
 */
export default function SystemDiagnosticsCard({
  diagnostics = {},
  isOpen = true,
  onToggle,
  onCopy,
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const tiles = [
    { label: 'Java', value: diagnostics.java || '—' },
    { label: 'MC Version', value: diagnostics.mcVersion || '—' },
    { label: 'Paper Build', value: diagnostics.paperBuild || '—' },
    { label: 'Plugins', value: diagnostics.pluginsLoaded || '—' },
    { label: 'RAM Used', value: diagnostics.ramUsed || '—' },
    { label: 'CPU Load', value: diagnostics.cpu || '—' },
    { label: 'Disk Used', value: diagnostics.diskUsed || '—' },
    { label: 'Container', value: diagnostics.container || '—' },
    { label: 'Uptime', value: diagnostics.uptime || '—' },
    { label: 'Node Uptime', value: diagnostics.nodeUptime || '—' },
  ];

  const handleCopyAll = () => {
    const text = tiles
      .map((t) => `${t.label}: ${t.value}`)
      .join('\n');
    onCopy(text, 'Copied system diagnostics to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CollapsibleSection
      title="System Diagnostics"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-3 pt-1">
        {/* 2-column small tiles grid */}
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((item) => (
            <div
              key={item.label}
              className="p-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33] flex flex-col justify-between"
            >
              <span className="text-[11px] text-[#9ca3af] font-medium leading-tight">
                {item.label}
              </span>
              <span className="text-[13px] font-semibold text-[#e5e7eb] font-mono mt-1 truncate">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => navigate('/diagnostics')}
            className="text-[11.5px] text-[#4ade80] hover:text-[#22c55e] py-1 px-2.5 rounded-[6px] hover:bg-[#4ade80]/10 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Stethoscope size={13} />
            <span>Open Self-Diagnostics</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="text-[11.5px] text-[#9ca3af] hover:text-[#e5e7eb] py-1 px-2.5 rounded-[6px] hover:bg-[#262a33] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={13} className="text-[#4ade80]" />
                <span className="text-[#4ade80]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
