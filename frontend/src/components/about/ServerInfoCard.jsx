import React from 'react';
import CollapsibleSection from '../settings/CollapsibleSection.jsx';

/**
 * Server Info overview card showing general game parameters.
 */
export default function ServerInfoCard({
  info = {},
  isOpen = true,
  onToggle,
}) {
  const rows = [
    { label: 'Server Name', value: info.serverName || '—' },
    { label: 'MOTD', value: info.motd || '—', truncate: true },
    { label: 'Version', value: info.version || '—' },
    { label: 'World Name', value: info.worldName || '—' },
    { label: 'World Size', value: info.worldSize || '—' },
    { label: 'Server Port', value: info.port || '—', fontMono: true },
    { label: 'Max Players', value: info.maxPlayers || '—', fontMono: true },
    {
      label: 'Online Mode',
      value: info.onlineMode || '—',
      badgeColor: info.onlineMode === 'Disabled' ? 'text-[#fbbf24]' : info.onlineMode === 'Enabled' ? 'text-[#4ade80]' : 'text-[#e5e7eb]',
    },
  ];

  return (
    <CollapsibleSection
      title="Server Info"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="divide-y divide-[#262a33]/60 pt-0.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="py-2.5 flex items-center justify-between text-[12px] gap-3"
          >
            <span className="text-[#9ca3af] shrink-0">{row.label}</span>
            <span
              className={`text-[#e5e7eb] font-medium text-right ${
                row.truncate ? 'truncate max-w-[220px]' : ''
              } ${row.fontMono ? 'font-mono' : ''} ${row.badgeColor || ''}`}
              title={row.value}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
