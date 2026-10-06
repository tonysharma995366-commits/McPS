import React from 'react';

/**
 * Standard Card component adhering to the global design system:
 * - Background: #1a1d24
 * - Border: #262a33
 * - Radius: 12px
 * - Padding: 14px
 */
export default function Card({ children, className = '', onClick, alert = false, stopped = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-[12px] p-[14px] bg-[#1a1d24] border border-[#262a33]
        ${stopped ? 'bg-gradient-to-b from-[#1a1d24] to-[#ef4444]/10 border-[#ef4444]/30' : ''}
        ${alert ? 'border-[#fbbf24]/40' : ''}
        ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
