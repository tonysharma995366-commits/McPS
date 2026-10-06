import React from 'react';

/**
 * Lightweight native range input slider with green accent styling
 */
export default function Slider({
  value,
  min = 4,
  max = 16,
  step = 1,
  onChange,
  label,
  helper,
  hint,
}) {
  return (
    <div className="py-2.5 border-b border-[#262a33]/60 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium text-[#e5e7eb]">{label}</span>
        <span className="text-[13px] font-mono font-semibold text-[#4ade80]">
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#262a33] rounded-lg appearance-none cursor-pointer accent-[#4ade80]"
      />

      <div className="flex items-center justify-between text-[10.5px] text-[#6b7280] mt-1 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {helper && (
        <p className="text-[11px] text-[#9ca3af] mt-1 leading-tight">{helper}</p>
      )}
      {hint && (
        <p className="text-[11px] text-[#fbbf24] mt-0.5 leading-tight font-medium">
          {hint}
        </p>
      )}
    </div>
  );
}
