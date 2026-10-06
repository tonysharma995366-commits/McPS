import React from 'react';
import SettingRow from './SettingRow.jsx';

const RULE_METADATA = [
  { key: 'keepInventory', label: 'Keep Inventory', hint: 'Players keep items and XP upon dying' },
  { key: 'mobGriefing', label: 'Mob Griefing', hint: 'Creepers, Endermen, and Withers damage blocks' },
  { key: 'doDaylightCycle', label: 'Daylight Cycle', hint: 'Time progresses naturally from day to night' },
  { key: 'doWeatherCycle', label: 'Weather Cycle', hint: 'Rain, snow, and thunderstorms occur automatically' },
  { key: 'fallDamage', label: 'Fall Damage', hint: 'Players and mobs take damage when falling' },
  { key: 'doFireTick', label: 'Fire Tick', hint: 'Fire spreads to nearby flammable blocks and burns out' },
  { key: 'naturalRegeneration', label: 'Natural Regeneration', hint: 'Players regenerate health from saturated hunger' },
];

export default function GameRulesSection({
  gameRules = {},
  onToggleRule,
}) {
  return (
    <div className="space-y-0.5">
      {RULE_METADATA.map((item) => (
        <SettingRow
          key={item.key}
          type="toggle"
          label={item.label}
          hint={item.hint}
          checked={Boolean(gameRules[item.key])}
          onToggle={(newVal) => onToggleRule(item.key, newVal)}
        />
      ))}

      <div className="pt-2 text-center">
        <p className="text-[11px] text-[#6b7280]">
          ⚡ Applied instantly via RCON. No restart needed.
        </p>
      </div>
    </div>
  );
}
