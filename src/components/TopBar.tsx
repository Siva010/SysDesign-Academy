'use client';

import { useEffect, useState } from 'react';
import { SearchTrigger } from './search/SearchTrigger';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  try {
    if (theme === 'system') window.localStorage.removeItem('sda.theme');
    else window.localStorage.setItem('sda.theme', theme);
  } catch {
    /* storage blocked: the theme still applies for this page view */
  }
}

export function TopBar() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('sda.theme');
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const cycle = () => {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="topbar">
      <SearchTrigger />
      <div className="topbar-spacer" />
      <button
        type="button"
        className="btn btn-sm"
        onClick={cycle}
        aria-label={`Theme: ${theme}. Click to change.`}
        title={`Theme: ${theme}`}
      >
        {theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}
      </button>
    </div>
  );
}
