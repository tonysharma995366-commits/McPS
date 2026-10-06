import React from 'react';
import Toggle from '../Toggle.jsx';

/**
 * Reusable Setting Row supporting Toggle and text/number Input
 */
export default function SettingRow({
  type = 'toggle',
  label,
  hint,
  helper,
  checked,
  onToggle,
  value,
  onChange,
  inputType = 'text',
  placeholder,
  error,
  badge,
  max,
  min,
  maxLength,
}) {
  if (type === 'toggle') {
    return (
      <div className="py-2.5 border-b border-[#262a33]/60 last:border-0 flex items-center justify-between gap-3 select-none">
        <div className="pr-2 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#e5e7eb] truncate">
              {label}
            </span>
            {badge}
          </div>
          {(hint || helper) && (
            <p className="text-[11px] text-[#9ca3af] leading-tight mt-0.5">
              {hint || helper}
            </p>
          )}
        </div>
        <Toggle checked={Boolean(checked)} onChange={onToggle} />
      </div>
    );
  }

  // Input Type (text or number)
  return (
    <div className="py-2.5 border-b border-[#262a33]/60 last:border-0 select-none">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-medium text-[#e5e7eb]">
            {label}
          </label>
          {badge}
        </div>
      </div>

      <input
        type={inputType}
        value={value ?? ''}
        onChange={(e) => onChange(inputType === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
        className={`
          w-full h-[38px] px-3 rounded-[8px] bg-[#0f1115] border text-[13px] text-[#e5e7eb] font-mono outline-none transition-colors duration-150
          ${error ? 'border-[#ef4444] focus:border-[#ef4444]' : 'border-[#262a33] focus:border-[#4ade80]'}
        `}
      />

      {error ? (
        <p className="text-[11px] text-[#ef4444] mt-1 leading-tight font-medium">
          {error}
        </p>
      ) : (
        (helper || hint) && (
          <p className="text-[11px] text-[#9ca3af] mt-1 leading-tight">
            {helper || hint}
          </p>
        )
      )}
    </div>
  );
}
