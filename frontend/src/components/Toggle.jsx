import React from 'react';

/**
 * Mobile-friendly switch toggle with min 44px touch target area
 */
export default function Toggle({ checked, onChange, disabled = false, id = 'toggle' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className="relative inline-flex items-center justify-center w-12 h-11 shrink-0 cursor-pointer disabled:opacity-50"
    >
      <div
        className={`
          w-11 h-6 rounded-full transition-colors duration-150 p-0.5
          ${checked ? 'bg-[#4ade80]' : 'bg-[#262a33]'}
        `}
      >
        <div
          className={`
            w-5 h-5 rounded-full bg-[#0f1115] shadow-sm transform transition-transform duration-150
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
    </button>
  );
}
