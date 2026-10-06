import React, { useState } from 'react';
import { ChevronRight, Clock, Calendar, Database, Minus, Plus } from 'lucide-react';
import Card from '../Card.jsx';
import Toggle from '../Toggle.jsx';
import BottomSheet from '../BottomSheet.jsx';

const FREQUENCY_OPTIONS = ['Hourly', 'Every 6h', 'Daily', 'Weekly'];
const HOURS_24 = Array.from({ length: 24 }).map((_, i) => `${String(i).padStart(2, '0')}:00`);

export default function AutoBackupCard({
  config = { enabled: false, frequency: 'Daily', time: '03:00', keep: 5 },
  onChange,
}) {
  const isEnabled = Boolean(config.enabled);

  // Sheets state
  const [frequencySheetOpen, setFrequencySheetOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);

  const handleToggle = (checked) => {
    onChange({ ...config, enabled: checked });
  };

  const handleSelectFrequency = (freq) => {
    onChange({ ...config, frequency: freq });
    setFrequencySheetOpen(false);
  };

  const handleSelectTime = (t) => {
    onChange({ ...config, time: t });
    setTimeSheetOpen(false);
  };

  const handleAdjustKeep = (delta) => {
    const nextVal = Math.min(20, Math.max(1, (config.keep || 5) + delta));
    onChange({ ...config, keep: nextVal });
  };

  return (
    <Card className="mb-3 select-none">
      {/* Top Header Row with Toggle */}
      <div className="flex items-center justify-between pb-3">
        <div className="min-w-0 pr-2">
          <h3 className="text-[14px] font-semibold text-[#e5e7eb] leading-snug">
            Auto-Backup
          </h3>
          <p className="text-[12px] text-[#9ca3af] leading-tight mt-0.5">
            Automatic world snapshots
          </p>
        </div>
        <Toggle checked={isEnabled} onChange={handleToggle} />
      </div>

      {/* Divider */}
      <div className="border-t border-[#262a33]" />

      {/* 3 Config Rows (disabled & muted if toggle is OFF) */}
      <div className={`pt-1 space-y-1 ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* 1. Frequency */}
        <div
          onClick={() => setFrequencySheetOpen(true)}
          className="py-2.5 px-1 flex items-center justify-between hover:bg-[#262a33]/40 rounded-[6px] cursor-pointer transition-colors duration-150"
        >
          <div className="flex items-center gap-2.5">
            <Calendar size={15} className="text-[#60a5fa]" />
            <span className="text-[13px] text-[#9ca3af]">Frequency</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-[#e5e7eb] font-medium">
            <span>{config.frequency || 'Daily'}</span>
            <ChevronRight size={15} className="text-[#6b7280]" />
          </div>
        </div>

        {/* 2. Time */}
        <div
          onClick={() => setTimeSheetOpen(true)}
          className="py-2.5 px-1 flex items-center justify-between hover:bg-[#262a33]/40 rounded-[6px] cursor-pointer transition-colors duration-150"
        >
          <div className="flex items-center gap-2.5">
            <Clock size={15} className="text-[#fbbf24]" />
            <span className="text-[13px] text-[#9ca3af]">Time</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-[#e5e7eb] font-mono font-medium">
            <span>{config.time || '03:00'} UTC</span>
            <ChevronRight size={15} className="text-[#6b7280]" />
          </div>
        </div>

        {/* 3. Keep Last (stepper) */}
        <div className="py-2 px-1 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database size={15} className="text-[#4ade80]" />
            <span className="text-[13px] text-[#9ca3af]">Keep last</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjustKeep(-1)}
              disabled={config.keep <= 1}
              className="w-7 h-7 rounded-[6px] bg-[#0f1115] hover:bg-[#262a33] border border-[#262a33] flex items-center justify-center text-[#e5e7eb] disabled:opacity-30 cursor-pointer"
            >
              <Minus size={13} />
            </button>
            <span className="text-[13px] font-semibold font-mono text-[#e5e7eb] min-w-[20px] text-center">
              {config.keep || 5}
            </span>
            <button
              type="button"
              onClick={() => handleAdjustKeep(1)}
              disabled={config.keep >= 20}
              className="w-7 h-7 rounded-[6px] bg-[#0f1115] hover:bg-[#262a33] border border-[#262a33] flex items-center justify-center text-[#e5e7eb] disabled:opacity-30 cursor-pointer"
            >
              <Plus size={13} />
            </button>
            <span className="text-[12px] text-[#9ca3af] ml-1">backups</span>
          </div>
        </div>
      </div>

      {/* Frequency Picker Sheet */}
      <BottomSheet
        isOpen={frequencySheetOpen}
        onClose={() => setFrequencySheetOpen(false)}
        title="Auto-Backup Frequency"
      >
        <div className="space-y-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectFrequency(opt)}
              className={`
                w-full p-3 rounded-[8px] border text-left text-[13px] font-medium transition-colors duration-150 cursor-pointer
                ${
                  config.frequency === opt
                    ? 'bg-[#262a33] border-[#4ade80] text-[#4ade80]'
                    : 'bg-[#0f1115] border-[#262a33] text-[#e5e7eb] hover:bg-[#1a1d24]'
                }
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Time 24h Grid Picker Sheet */}
      <BottomSheet
        isOpen={timeSheetOpen}
        onClose={() => setTimeSheetOpen(false)}
        title="Backup Time (UTC)"
      >
        <div className="grid grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto">
          {HOURS_24.map((hour) => {
            const isSelected = config.time === hour;
            return (
              <button
                key={hour}
                type="button"
                onClick={() => handleSelectTime(hour)}
                className={`
                  h-[40px] rounded-[6px] text-[12.5px] font-mono font-medium flex items-center justify-center border transition-colors duration-150 cursor-pointer
                  ${
                    isSelected
                      ? 'bg-[#262a33] border-[#4ade80] text-[#4ade80] font-bold'
                      : 'bg-[#0f1115] border-[#262a33] text-[#e5e7eb] hover:bg-[#1a1d24]'
                  }
                `}
              >
                {hour}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </Card>
  );
}
