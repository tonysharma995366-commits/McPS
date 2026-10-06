import React from 'react';
import { Boxes, ExternalLink, LogOut, Heart } from 'lucide-react';
import CollapsibleSection from '../settings/CollapsibleSection.jsx';

/**
 * App Information card displaying app branding, repository links, license,
 * and session logout action.
 */
export default function AppInfoCard({
  isOpen = true,
  onToggle,
  onLogout,
}) {
  const links = [
    { label: 'GitHub Repository', url: 'https://github.com' },
    { label: 'Documentation', url: 'https://docs.railway.app' },
    { label: 'Report an Issue', url: 'https://github.com/issues' },
  ];

  return (
    <CollapsibleSection
      title="About App"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-4 pt-1 select-none">
        {/* Centered App Branding */}
        <div className="flex flex-col items-center justify-center text-center py-2">
          <div className="w-[56px] h-[56px] rounded-[14px] bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80] flex items-center justify-center mb-2 shadow-inner">
            <Boxes size={28} strokeWidth={2.2} />
          </div>
          <h4 className="text-[15px] font-bold text-[#e5e7eb]">
            MC Admin Panel
          </h4>
          <p className="text-[11.5px] font-mono text-[#9ca3af] mt-0.5">
            v1.0.0 · build 2024.10
          </p>
          <p className="text-[11px] text-[#6b7280] mt-1 max-w-[260px] leading-tight">
            Lightweight, mobile-first Minecraft server management for Railway
          </p>
        </div>

        {/* Links & License Rows */}
        <div className="divide-y divide-[#262a33]/60 border-t border-b border-[#262a33]/60 text-[12px]">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 flex items-center justify-between text-[#9ca3af] hover:text-[#e5e7eb] transition-colors"
            >
              <span>{item.label}</span>
              <ExternalLink size={13} className="text-[#6b7280]" />
            </a>
          ))}

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-[#9ca3af]">License</span>
            <span className="text-[#e5e7eb] font-mono font-medium">MIT</span>
          </div>
        </div>

        {/* Made with love */}
        <div className="text-center">
          <p className="text-[11.5px] text-[#6b7280] flex items-center justify-center gap-1">
            <span>Made with</span>
            <Heart size={12} className="text-[#ef4444] fill-[#ef4444]" />
            <span>for Railway</span>
          </p>
        </div>

        {/* Logout Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[42px] px-3 rounded-[8px] border border-[#ef4444]/30 hover:bg-[#ef4444]/10 text-[#ef4444] text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Log Out of Session</span>
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
