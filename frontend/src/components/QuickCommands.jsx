import React from 'react';

const QUICK_COMMANDS = [
  { label: '/save-all', cmd: '/save-all', needsConfirm: false },
  { label: '/say', cmd: '/say ', needsConfirm: false },
  { label: '/op', cmd: '/op ', needsConfirm: false },
  { label: '/kick', cmd: '/kick ', needsConfirm: false },
  { label: '/reload confirm', cmd: '/reload confirm', needsConfirm: true },
];

/**
 * Compact Quick Command Chips (height: 32px)
 * Horizontal scrollable row above the command input bar
 */
export default function QuickCommands({ onSelectCommand, onExecuteCommand }) {
  const handleClick = (item) => {
    if (item.cmd.endsWith(' ')) {
      // Command template with trailing space: prefill input
      onSelectCommand(item.cmd);
    } else {
      // Execute immediately (or prompt confirm)
      onExecuteCommand(item.cmd, item.needsConfirm);
    }
  };

  return (
    <div className="h-[32px] flex items-center px-3 bg-[#0f1115] overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-1.5 shrink-0">
        {QUICK_COMMANDS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleClick(item)}
            className="h-[24px] px-2.5 rounded-[6px] bg-[#1a1d24]/80 hover:bg-[#262a33] border border-[#262a33] text-[11px] font-mono text-[#9ca3af] hover:text-[#4ade80] whitespace-nowrap transition-colors duration-150 cursor-pointer select-none active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
