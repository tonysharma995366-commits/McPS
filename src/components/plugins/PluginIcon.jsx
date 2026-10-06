import React, { memo } from 'react';
import { Puzzle } from 'lucide-react';

const PALETTE = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#34d399'];

function getColorFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

const PluginIcon = memo(function PluginIcon({ name = '', size = 40 }) {
  const initial = name ? name.charAt(0).toUpperCase() : '';
  const textColor = getColorFromName(name);
  const isLarge = size >= 50;

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-[8px] ${isLarge ? 'rounded-[12px]' : ''} bg-[#262a33] flex items-center justify-center shrink-0 select-none shadow-sm`}
    >
      {initial ? (
        <span
          style={{ color: textColor }}
          className={`${isLarge ? 'text-[22px]' : 'text-[16px]'} font-semibold tracking-tight uppercase leading-none`}
        >
          {initial}
        </span>
      ) : (
        <Puzzle size={isLarge ? 24 : 18} className="text-[#9ca3af]" />
      )}
    </div>
  );
});

export default PluginIcon;
