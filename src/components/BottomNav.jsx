import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Terminal, Users, Puzzle } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Console', icon: Terminal, path: '/console' },
  { label: 'Players', icon: Users, path: '/players' },
  { label: 'Plugins', icon: Puzzle, path: '/plugins' },
];

/**
 * Fixed Bottom Navigation (height 60px)
 * 4 items only: Dashboard, Console, Players, Plugins
 */
const BottomNav = memo(function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[60px] pb-[env(safe-area-inset-bottom)] bg-[#0f1115]/95 backdrop-blur-sm border-t border-[#262a33]">
      <div className="max-w-[480px] mx-auto h-full grid grid-cols-4 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `
                flex flex-col items-center justify-center min-h-[44px] h-full
                transition-colors duration-150 cursor-pointer select-none
                ${isActive ? 'text-[#4ade80]' : 'text-[#9ca3af] hover:text-[#e5e7eb]'}
              `}
            >
              <Icon size={20} strokeWidth={2} className="mb-1" />
              <span className="text-[11px] font-medium leading-none">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNav;
