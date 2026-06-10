"use client";

import { BOARD_THEMES, type BoardTheme } from "@rechess/shared";

interface ThemeSelectorProps {
  current: BoardTheme;
  onChange: (theme: BoardTheme) => void;
}

export function ThemeSelector({ current, onChange }: ThemeSelectorProps) {
  return (
    <div className="flex gap-2">
      {BOARD_THEMES.map((theme) => (
        <button
          key={theme.name}
          onClick={() => onChange(theme)}
          className={`w-8 h-8 rounded border-2 overflow-hidden ${current.name === theme.name ? "border-accent" : "border-transparent"}`}
          title={theme.name}
        >
          <div className="w-full h-1/2" style={{ background: theme.light }} />
          <div className="w-full h-1/2" style={{ background: theme.dark }} />
        </button>
      ))}
    </div>
  );
}
