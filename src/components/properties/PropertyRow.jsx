import React, { memo } from 'react';
import PropertyInput from './PropertyInput.jsx';
import {
  humanizeKey,
  HINTS,
  getPropertyInputType,
  RESTART_REQUIRED_KEYS,
} from '../../lib/propertyMeta.js';

/**
 * Single property item row with humanized title, raw key, hint,
 * modified-from-default indicator, and type-based input renderer.
 * Memoized to prevent re-rendering all rows on single input keystrokes.
 */
const PropertyRow = memo(
  function PropertyRow({
    propKey,
    value,
    defaultValue,
    onChange,
    error,
  }) {
    const title = humanizeKey(propKey);
    const hint = HINTS[propKey];
    const isModified = String(value) !== String(defaultValue);
    const inputType = getPropertyInputType(propKey, value);
    const isRestartRequired = RESTART_REQUIRED_KEYS.has(propKey);

    const isToggle = inputType === 'toggle';

    return (
      <div className="py-3 border-b border-[#262a33]/60 last:border-b-0">
        <div className="flex items-start justify-between gap-3">
          {/* Label + Meta Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Orange dot if modified from factory default */}
              {isModified && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0"
                  title="Modified from default value"
                />
              )}

              <span className="text-[13px] font-semibold text-[#e5e7eb] truncate">
                {title}
              </span>

              {isRestartRequired && (
                <span className="text-[9.5px] font-mono font-medium px-1.5 py-0.2 rounded-[4px] bg-[#262a33] text-[#9ca3af]">
                  restart
                </span>
              )}
            </div>

            {/* Raw Key Name */}
            <div className="font-mono text-[10.5px] text-[#6b7280] truncate mt-0.5 select-all">
              {propKey}
            </div>

            {/* Hint text if available */}
            {hint && (
              <p className="text-[11px] text-[#9ca3af] mt-1 leading-snug">
                {hint}
              </p>
            )}
          </div>

          {/* Toggle renders neatly aligned right on the header row */}
          {isToggle && (
            <div className="shrink-0 pt-0.5">
              <PropertyInput
                propKey={propKey}
                type={inputType}
                value={value}
                onChange={(nextVal) => onChange(propKey, nextVal)}
                hasError={Boolean(error)}
              />
            </div>
          )}
        </div>

        {/* Other input types render below header */}
        {!isToggle && (
          <div>
            <PropertyInput
              propKey={propKey}
              type={inputType}
              value={value}
              onChange={(nextVal) => onChange(propKey, nextVal)}
              hasError={Boolean(error)}
            />
          </div>
        )}

        {/* Validation Error Message */}
        {error && (
          <p className="text-[11px] text-[#ef4444] mt-1 font-medium flex items-center gap-1">
            <span>⚠</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.propKey === next.propKey &&
    prev.value === next.value &&
    prev.defaultValue === next.defaultValue &&
    prev.error === next.error
);

export default PropertyRow;
