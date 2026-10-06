import React, { useState, useEffect } from 'react';
import { AlertTriangle, RotateCw, Save, Check } from 'lucide-react';
import SettingRow from './SettingRow.jsx';
import Slider from './Slider.jsx';
import SegmentedControl from './SegmentedControl.jsx';

const DIFFICULTY_OPTIONS = [
  { label: 'Peaceful', value: 'peaceful' },
  { label: 'Easy', value: 'easy' },
  { label: 'Normal', value: 'normal' },
  { label: 'Hard', value: 'hard' },
];

export default function ServerPropertiesSection({
  properties = {},
  livePort = 25565,
  onSave,
  onRequestRestart,
  isSaving = false,
}) {
  // Local editable form state to track dirty state and validate
  const [formData, setFormData] = useState(properties);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setFormData(properties);
  }, [properties]);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasSaved(false);
  };

  // Compare with original properties to compute dirty state
  const isDirty = Object.keys(formData).some(
    (key) => formData[key] !== properties[key]
  );

  // Field Validations
  const portNum = Number(formData.serverPort);
  const portError =
    portNum < 1024 || portNum > 65535
      ? 'Port must be between 1024 and 65535'
      : null;

  const maxPlayersNum = Number(formData.maxPlayers);
  const maxPlayersError =
    maxPlayersNum < 1 || maxPlayersNum > 100
      ? 'Max players must be between 1 and 100'
      : null;

  const motdError =
    (formData.motd || '').length > 60 ? 'MOTD exceeds 60 characters limit' : null;

  const spawnProtNum = Number(formData.spawnProtection);
  const spawnProtError =
    spawnProtNum < 0 || spawnProtNum > 64
      ? 'Spawn protection must be between 0 and 64'
      : null;

  const hasErrors = Boolean(portError || maxPlayersError || motdError || spawnProtError);

  const handleSaveClick = () => {
    if (!isDirty || hasErrors || isSaving) return;
    onSave(formData);
    setHasSaved(true);
  };

  const isPortPending = formData.serverPort !== livePort;

  return (
    <div className="space-y-1">
      {/* Warning Banner at top of section */}
      <div className="flex items-center gap-2 p-2.5 mb-2 rounded-[8px] bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[#fbbf24] text-[12px]">
        <AlertTriangle size={15} className="shrink-0" />
        <span className="font-medium">⚠ Changing these requires a server restart</span>
      </div>

      {/* 1. MOTD */}
      <SettingRow
        type="input"
        label="Server MOTD"
        value={formData.motd || ''}
        onChange={(val) => updateField('motd', val)}
        helper="Message shown in player's Minecraft multiplayer list"
        maxLength={60}
        error={motdError}
      />

      {/* 2. Server Port */}
      <SettingRow
        type="input"
        inputType="number"
        label="Server Port"
        value={formData.serverPort ?? 25565}
        onChange={(val) => updateField('serverPort', val)}
        helper="Railway assigns a port automatically. Only change if required."
        min={1024}
        max={65535}
        error={portError}
        badge={
          isPortPending ? (
            <span className="text-[10px] font-medium bg-[#fbbf24]/15 text-[#fbbf24] px-1.5 py-0.5 rounded-[4px]">
              Pending restart
            </span>
          ) : (
            <span className="text-[10px] font-medium bg-[#4ade80]/15 text-[#4ade80] px-1.5 py-0.5 rounded-[4px]">
              Live: {livePort}
            </span>
          )
        }
      />

      {/* 3. Max Players */}
      <SettingRow
        type="input"
        inputType="number"
        label="Max Players"
        value={formData.maxPlayers ?? 20}
        onChange={(val) => updateField('maxPlayers', val)}
        helper="Maximum concurrent slots available on server"
        min={1}
        max={100}
        error={maxPlayersError}
      />

      {/* 4. View Distance */}
      <Slider
        label="View Distance"
        value={formData.viewDistance ?? 8}
        min={4}
        max={16}
        onChange={(val) => updateField('viewDistance', val)}
        helper="Lower view distance improves server tick rate on cloud containers"
        hint="Recommended: 6-8 for low memory systems"
      />

      {/* 5. Simulation Distance */}
      <Slider
        label="Simulation Distance"
        value={formData.simulationDistance ?? 6}
        min={4}
        max={12}
        onChange={(val) => updateField('simulationDistance', val)}
        helper="Distance from player where entities and blocks are updated"
      />

      {/* 6. Online Mode */}
      <SettingRow
        type="toggle"
        label="Online Mode"
        hint="Verify player accounts with Mojang. Disable only for offline/cracked"
        checked={Boolean(formData.onlineMode)}
        onToggle={(val) => updateField('onlineMode', val)}
      />

      {/* 7. Whitelist */}
      <SettingRow
        type="toggle"
        label="Server Whitelist"
        hint="Only listed players in whitelist can connect"
        checked={Boolean(formData.whiteList)}
        onToggle={(val) => updateField('whiteList', val)}
      />

      {/* 8. PvP */}
      <SettingRow
        type="toggle"
        label="Player vs Player (PvP)"
        hint="Allow players to attack and damage other players"
        checked={Boolean(formData.pvp)}
        onToggle={(val) => updateField('pvp', val)}
      />

      {/* 9. Spawn Protection */}
      <SettingRow
        type="input"
        inputType="number"
        label="Spawn Protection"
        value={formData.spawnProtection ?? 16}
        onChange={(val) => updateField('spawnProtection', val)}
        helper="Radius in blocks around spawn where non-OPs cannot build"
        min={0}
        max={64}
        error={spawnProtError}
      />

      {/* 10. Difficulty */}
      <SegmentedControl
        label="World Difficulty"
        options={DIFFICULTY_OPTIONS}
        value={formData.difficulty || 'normal'}
        onChange={(val) => updateField('difficulty', val)}
        helper="Controls mob damage, starvation, and hostile spawning"
      />

      {/* Save & Restart Row */}
      <div className="pt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={!isDirty || hasErrors || isSaving}
          onClick={handleSaveClick}
          className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-40 text-[#0f1115] font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving...' : 'Save Properties'}</span>
        </button>

        {hasSaved && (
          <button
            type="button"
            onClick={onRequestRestart}
            className="min-h-[44px] px-3 rounded-[8px] border border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/10 text-[12.5px] font-medium flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0"
          >
            <RotateCw size={14} />
            <span>Restart Server</span>
          </button>
        )}
      </div>
    </div>
  );
}
