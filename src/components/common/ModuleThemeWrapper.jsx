import React from 'react';
import { MODULE_THEMES } from '../../constants/moduleThemes';

export default function ModuleThemeWrapper({ themeKey, children }) {
  const theme = MODULE_THEMES[themeKey] || MODULE_THEMES.recursos || {};

  return (
    <div
      className="module-theme-root w-full min-h-screen bg-slate-50 text-slate-800"
      style={{
        '--mod-accent': theme.accent,
        '--mod-accent-hover': theme.accentHover,
        '--mod-accent-soft': theme.soft,
        '--mod-accent-border': theme.border,
        '--mod-accent-text': theme.text
      }}
    >
      {children}
    </div>
  );
}
