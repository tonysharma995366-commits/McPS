import React from 'react';

/**
 * Animated SVG Health Ring Gauge
 * Displays fraction in center with color-coded ring status.
 */
export default function HealthRing({
  passed = 0,
  total = 0,
  health = 'GOOD',
  size = 76,
  strokeWidth = 6,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, Math.max(0, passed / total)) : 0;
  const strokeDashoffset = circumference - ratio * circumference;

  let strokeColor = '#4ade80'; // Green
  let glowColor = 'rgba(74, 222, 128, 0.25)';

  if (health === 'CRITICAL' || (total > 0 && passed / total < 0.7)) {
    strokeColor = '#ef4444'; // Red
    glowColor = 'rgba(239, 68, 68, 0.25)';
  } else if (health === 'WARNING' || health === 'GOOD' && passed < total) {
    strokeColor = '#fbbf24'; // Yellow
    glowColor = 'rgba(251, 191, 36, 0.25)';
  }

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#262a33"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Text Fraction */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[13.5px] font-bold text-[#e5e7eb] font-mono leading-none tracking-tight">
          {passed}/{total}
        </span>
      </div>
    </div>
  );
}
