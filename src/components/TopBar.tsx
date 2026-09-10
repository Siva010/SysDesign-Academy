'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SearchTrigger } from './search/SearchTrigger';

type Theme = 'system' | 'light' | 'paper' | 'dark';

/** Auto, then the two light themes, then dark. Paper is the warm, lower-glare option for long reads. */
const CYCLE: Theme[] = ['system', 'light', 'paper', 'dark'];
const LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', paper: 'Paper', dark: 'Dark' };

/** Pages with a reading column. Focus mode only means something on these. */
const READING_PAGE = /^\/(lessons|case-studies|patterns|failures)\/[^/]+/;

/** Scroll distances under this are jitter, not intent, and should not move the bar. */
const SCROLL_INTENT_PX = 6;

/** Near the top of the page the bar always shows: there is no reading to give room to yet. */
const ALWAYS_SHOWN_ABOVE_PX = 96;

function remember(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice still applies for this page view */
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  remember('sda.theme', theme === 'system' ? null : theme);
}

export function TopBar() {
  const pathname = usePathname() ?? '';
  const reading = READING_PAGE.test(pathname);
  const bar = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme>('system');
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('sda.theme');
      if (stored === 'light' || stored === 'dark' || stored === 'paper') setTheme(stored);
    } catch {
      /* ignore */
    }
    /* Focus mode is applied before first paint by the script in the root layout; read it back. */
    setFocus(document.documentElement.getAttribute('data-focus') === 'on');
  }, []);

  /*
   * Hide on scroll down, return on scroll up. Reading is almost entirely downward scrolling, so
   * this gives the bar's height back for the whole read while keeping it one gesture away. It
   * never hides while anything inside it has focus.
   */
  useEffect(() => {
    const root = document.documentElement;
    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      const focused = bar.current?.contains(document.activeElement) ?? false;
      if (y < ALWAYS_SHOWN_ABOVE_PX || delta < -SCROLL_INTENT_PX || focused) {
        root.removeAttribute('data-topbar');
      } else if (delta > SCROLL_INTENT_PX) {
        root.setAttribute('data-topbar', 'hidden');
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      root.removeAttribute('data-topbar');
    };
  }, []);

  /* A new page starts with the bar visible. */
  useEffect(() => {
    document.documentElement.removeAttribute('data-topbar');
  }, [pathname]);

  const cycleTheme = () => {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]!;
    setTheme(next);
    applyTheme(next);
  };

  const toggleFocus = () => {
    const next = !focus;
    setFocus(next);
    const root = document.documentElement;
    if (next) root.setAttribute('data-focus', 'on');
    else root.removeAttribute('data-focus');
    remember('sda.focus', next ? 'on' : null);
  };

  return (
    <div
      className="topbar"
      ref={bar}
      onFocusCapture={() => document.documentElement.removeAttribute('data-topbar')}
    >
      <SearchTrigger />
      <div className="topbar-spacer" />
      {reading && (
        <button
          type="button"
          className="btn btn-sm reading-toggle"
          aria-pressed={focus}
          onClick={toggleFocus}
          title="Hide the navigation and side panel while reading"
        >
          {focus ? 'Exit focus' : 'Focus'}
        </button>
      )}
      <button
        type="button"
        className="btn btn-sm"
        onClick={cycleTheme}
        aria-label={`Theme: ${LABEL[theme]}. Click to change.`}
        title={`Theme: ${LABEL[theme]}`}
      >
        {LABEL[theme]}
      </button>
    </div>
  );
}
