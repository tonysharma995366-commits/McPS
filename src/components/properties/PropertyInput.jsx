import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Toggle from '../Toggle.jsx';
import {
  DIFFICULTY_OPTIONS,
  GAMEMODE_OPTIONS,
  LEVEL_TYPE_OPTIONS,
  OP_PERMISSION_OPTIONS,
  SLIDER_CONFIGS,
} from '../../lib/propertyMeta.js';

/**
 * Type-based field input renderer for server properties
 */
export default function PropertyInput({
  propKey,
  type,
  value,
  onChange,
  hasError,
}) {
  const [showPassword, setShowPassword] = useState(false);

  // 1. Toggle (boolean)
  if (type === 'toggle') {
    const isChecked = String(value).toLowerCase() === 'true';
    return (
      <Toggle
        checked={isChecked}
        onChange={(next) => onChange(String(next))}
      />
    );
  }

  // 2. Difficulty Segmented Control
  if (type === 'difficulty_segmented') {
    return (
      <div className="grid grid-cols-4 gap-1 p-1 rounded-[8px] bg-[#0f1115] border border-[#262a33] mt-2">
        {DIFFICULTY_OPTIONS.map((opt) => {
          const isSelected = String(value).toLowerCase() === opt.value.toLowerCase();
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`h-[34px] rounded-[6px] text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center truncate px-1 ${
                isSelected
                  ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/40 font-semibold'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // 3. Gamemode Segmented Control
  if (type === 'gamemode_segmented') {
    return (
      <div className="grid grid-cols-4 gap-1 p-1 rounded-[8px] bg-[#0f1115] border border-[#262a33] mt-2">
        {GAMEMODE_OPTIONS.map((opt) => {
          const isSelected = String(value).toLowerCase() === opt.value.toLowerCase();
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`h-[34px] rounded-[6px] text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center truncate px-1 ${
                isSelected
                  ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/40 font-semibold'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // 4. OP / Function Permission Level (1-4)
  if (type === 'permission_segmented') {
    return (
      <div className="grid grid-cols-4 gap-1 p-1 rounded-[8px] bg-[#0f1115] border border-[#262a33] mt-2">
        {OP_PERMISSION_OPTIONS.map((opt) => {
          const isSelected = String(value) === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`h-[34px] rounded-[6px] text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center truncate px-1 ${
                isSelected
                  ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/40 font-semibold'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // 5. Level Type Dropdown / Select
  if (type === 'level_type_select') {
    return (
      <div className="mt-2">
        <select
          value={value || 'minecraft:normal'}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[36px] px-2.5 rounded-[8px] bg-[#0f1115] border border-[#262a33] focus:border-[#4ade80] text-[#e5e7eb] text-[12.5px] outline-none cursor-pointer"
        >
          {LEVEL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1d24] text-[#e5e7eb]">
              {opt.label} ({opt.value})
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 6. Slider
  if (type === 'slider') {
    const cfg = SLIDER_CONFIGS[propKey] || { min: 0, max: 100, step: 1 };
    const numVal = Number(value) || 0;
    return (
      <div className="w-full mt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#9ca3af] font-mono text-[11px]">{cfg.helper || ''}</span>
          <span className="font-mono font-semibold text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-[4px] border border-[#4ade80]/20">
            {value}
          </span>
        </div>
        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          value={numVal}
          onChange={(e) => onChange(String(e.target.value))}
          className="w-full h-1.5 bg-[#262a33] rounded-lg appearance-none cursor-pointer accent-[#4ade80]"
        />
        <div className="flex justify-between text-[10px] text-[#6b7280] font-mono px-0.5">
          <span>{cfg.min}</span>
          <span>{cfg.max}</span>
        </div>
      </div>
    );
  }

  // 7. Password with Eye Toggle (e.g. rcon.password)
  if (type === 'password') {
    return (
      <div className="relative mt-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter RCON password..."
          className={`w-full h-[36px] pl-3 pr-10 rounded-[8px] bg-[#0f1115] border text-[#e5e7eb] text-[12.5px] font-mono outline-none transition-colors ${
            hasError
              ? 'border-[#ef4444] focus:border-[#ef4444]'
              : 'border-[#262a33] focus:border-[#4ade80]'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-[#e5e7eb] cursor-pointer"
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    );
  }

  // 8. Number input
  if (type === 'number') {
    return (
      <div className="mt-2">
        <input
          type="number"
          inputMode="numeric"
          enterKeyHint="done"
          onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={`w-full h-[36px] px-3 rounded-[8px] bg-[#0f1115] border text-[#e5e7eb] text-[12.5px] font-mono outline-none transition-colors ${
            hasError
              ? 'border-[#ef4444] focus:border-[#ef4444]'
              : 'border-[#262a33] focus:border-[#4ade80]'
          }`}
        />
      </div>
    );
  }

  // 9. Standard Text input
  return (
    <div className="mt-2">
      <input
        type="text"
        enterKeyHint="done"
        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Default value"
        spellCheck={false}
        className={`w-full h-[36px] px-3 rounded-[8px] bg-[#0f1115] border text-[#e5e7eb] text-[12.5px] outline-none transition-colors ${
          hasError
            ? 'border-[#ef4444] focus:border-[#ef4444]'
            : 'border-[#262a33] focus:border-[#4ade80]'
        }`}
      />
    </div>
  );
}
