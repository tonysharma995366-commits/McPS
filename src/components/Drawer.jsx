import React, { useEffect, memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Globe, Archive, SlidersHorizontal, Layers, Info, Stethoscope, LogOut, X } from 'lucide-react';

const SECONDARY_ITEMS = [
  { label: 'World & Settings', icon: Globe, path: '/settings' },
  { label: 'Backups', icon: Archive, path: '/backups' },
  { label: 'Server Properties', icon: SlidersHorizontal, path: '/properties' },
  { label: 'Versions & Bedrock', icon: Layers, path: '/versions' },
];

/**
 * Slide-out Drawer (width 260px)
 * Contains secondary navigation items only with 50% black overlay backdrop
 * Rendered only when open to optimize performance.
 */
const Drawer = memo(function Drawer({ isOpen, onClose, onLogout }) {
  // Prevent body scroll and listen for Escape key when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Navigation drawer">
      {/* 50% Black Backdrop Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150 animate-in fade-in"
      />

      {/* Slide Drawer */}
      <aside
        className="fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-[#1a1d24] border-r border-[#262a33] flex flex-col justify-between py-4 px-3 shadow-2xl transition-transform duration-150 ease-out animate-in slide-in-from-left duration-150"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#262a33]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
              <span className="text-[15px] font-semibold text-[#e5e7eb] tracking-wide">
                MC RailAdmin
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#9ca3af] hover:text-[#e5e7eb] rounded-[6px] transition-colors duration-150 cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation links */}
          <div className="space-y-1">
            {SECONDARY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 min-h-[44px] rounded-[8px] text-[13px] font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-[#262a33] text-[#4ade80]'
                        : 'text-[#e5e7eb] hover:bg-[#262a33]/60'
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0 text-[#9ca3af]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-[#262a33] my-3" />

          {/* App Info link */}
          <NavLink
            to="/about"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 min-h-[44px] rounded-[8px] text-[13px] font-medium
              transition-colors duration-150
              ${
                isActive
                  ? 'bg-[#262a33] text-[#4ade80]'
                  : 'text-[#e5e7eb] hover:bg-[#262a33]/60'
              }
            `}
          >
            <Info size={18} className="shrink-0 text-[#9ca3af]" />
            <span>App Info</span>
          </NavLink>

          {/* Diagnostics link */}
          <NavLink
            to="/diagnostics"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 min-h-[44px] rounded-[8px] text-[13px] font-medium
              transition-colors duration-150 mt-1
              ${
                isActive
                  ? 'bg-[#262a33] text-[#4ade80]'
                  : 'text-[#e5e7eb] hover:bg-[#262a33]/60'
              }
            `}
          >
            <Stethoscope size={18} className="shrink-0 text-[#9ca3af]" />
            <span>Diagnostics</span>
          </NavLink>
        </div>

        {/* Footer / Logout */}
        <div className="pt-2 border-t border-[#262a33]">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 min-h-[44px] rounded-[8px] text-[13px] font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={18} className="shrink-0 text-[#ef4444]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
});

export default Drawer;
