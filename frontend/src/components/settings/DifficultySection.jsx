import React from 'react';
import SettingRow from './SettingRow.jsx';
import SegmentedControl from './SegmentedControl.jsx';

const GAMEMODE_OPTIONS = [
  { label: 'Survival', value: 'survival' },
  { label: 'Creative', value: 'creative' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Spectator', value: 'spectator' },
];

export default function DifficultySection({
  properties = {},
  onChangeField,
}) {
  return (
    <div className="space-y-1">
      {/* Default Gamemode */}
      <SegmentedControl
        label="Default Gamemode"
        options={GAMEMODE_OPTIONS}
        value={properties.gamemode || 'survival'}
        onChange={(val) => onChangeField('gamemode', val)}
        helper="Applied to all newly connected players"
      />

      {/* Force Gamemode */}
      <SettingRow
        type="toggle"
        label="Force Gamemode"
        hint="Forces default gamemode on join even if previously changed"
        checked={Boolean(properties.forceGamemode)}
        onToggle={(val) => onChangeField('forceGamemode', val)}
      />

      {/* Spawn Monsters */}
      <SettingRow
        type="toggle"
        label="Spawn Monsters"
        hint="Allow hostile mobs (Zombies, Skeletons, Creepers) to spawn"
        checked={Boolean(properties.spawnMonsters ?? true)}
        onToggle={(val) => onChangeField('spawnMonsters', val)}
      />

      {/* Spawn Animals */}
      <SettingRow
        type="toggle"
        label="Spawn Animals"
        hint="Allow passive mobs (Cows, Sheep, Pigs, Chickens) to spawn"
        checked={Boolean(properties.spawnAnimals ?? true)}
        onToggle={(val) => onChangeField('spawnAnimals', val)}
      />

      {/* Spawn NPCs */}
      <SettingRow
        type="toggle"
        label="Spawn NPCs"
        hint="Allow villagers and wandering traders to generate and spawn"
        checked={Boolean(properties.spawnNpcs ?? true)}
        onToggle={(val) => onChangeField('spawnNpcs', val)}
      />

      {/* Allow Flight */}
      <SettingRow
        type="toggle"
        label="Allow Flight"
        hint="Prevent server from kicking players flying in Survival mode"
        checked={Boolean(properties.allowFlight)}
        onToggle={(val) => onChangeField('allowFlight', val)}
      />

      {/* Allow Nether */}
      <SettingRow
        type="toggle"
        label="Allow Nether"
        hint="Enable portals to the Nether dimension"
        checked={Boolean(properties.allowNether ?? true)}
        onToggle={(val) => onChangeField('allowNether', val)}
      />

      {/* Allow End */}
      <SettingRow
        type="toggle"
        label="Allow End"
        hint="Enable access to the End dimension and Ender Dragon"
        checked={Boolean(properties.allowEnd ?? true)}
        onToggle={(val) => onChangeField('allowEnd', val)}
      />
    </div>
  );
}
