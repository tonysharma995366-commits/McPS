import React from 'react';

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  label,
  helper,
}) {
  return (
    <div className="py-2.5 border-b border-[#262a33]/60 last:border-0 select-none">
      {label && (
        <span className="block text-[13px] font-medium text-[#e5e7eb] mb-1.5">
          {label}
        </span>
      )}

      <div className="grid grid-cols-4 gap-1 p-1 rounded-[8px] bg-[#0f1115] border border-[#262a33]">
        {options.map((opt) => {
          const isSelected = String(value).toLowerCase() === String(opt.value).toLowerCase();
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`
                min-h-[34px] rounded-[6px] text-[11.5px] font-medium transition-colors duration-150 flex items-center justify-center text-center truncate px-1 cursor-pointer
                ${
                  isSelected
                    ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/40 font-semibold'
                    : 'text-[#9ca3af] hover:text-[#e5e7eb]'
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {helper && (
        <p className="text-[11px] text-[#9ca3af] mt-1 leading-tight">{helper}</p>
      )}
    </div>
  );
}
