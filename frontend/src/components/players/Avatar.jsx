import React, { memo } from 'react';

const PALETTE = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#34d399'];

function getColorFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

const Avatar = memo(function Avatar({ name = '?', size = 36, color }) {
  const initial = (name ? name.charAt(0) : '?').toUpperCase();
  const textColor = color || getColorFromName(name);

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className="rounded-full bg-[#262a33] flex items-center justify-center shrink-0 select-none shadow-sm"
    >
      <span
        style={{ color: textColor }}
        className="text-[14px] font-semibold tracking-tight uppercase leading-none"
      >
        {initial}
      </span>
    </div>
  );
});

export default Avatar;
