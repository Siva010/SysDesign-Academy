'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LEVELS } from '@/content/curriculum';
import { useProgress, summarise } from '@/lib/progress';
import { LEVEL_CONCEPTS } from '@/content/level-concepts';

interface NavItem {
  href: string;
  label: string;
  hint?: string;
}

const LIBRARY: NavItem[] = [
  { href: '/concepts', label: 'Concept graph' },
  { href: '/patterns', label: 'Pattern library' },
  { href: '/case-studies', label: 'Case studies' },
  { href: '/failures', label: 'Failure library' },
  { href: '/decisions', label: 'Decision tables' },
  { href: '/estimate', label: 'Estimation toolkit' },
  { href: '/myths', label: 'Myths' },
  { href: '/glossary', label: 'Glossary' },
];

const PRACTICE: NavItem[] = [
  { href: '/method', label: 'Interview method' },
  { href: '/interview', label: 'Interview simulator' },
  { href: '/next', label: 'What to learn next' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state, ready } = useProgress();
  const [open, setOpen] = useState(false);

  /* On narrow screens the nav is collapsed so the content is the first thing on screen.
     Navigating closes it, or the menu covers the page you just asked for. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isCurrent = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  return (
    <nav className={`sidebar${open ? ' open' : ''}`} aria-label="Main">
      <Link href="/" className="sidebar-brand">
        <strong>System Design Academy</strong>
        <span>Reason about real systems</span>
      </Link>

      <button
        type="button"
        className="sidebar-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Close menu' : 'Menu'}
      </button>

      <div className="sidebar-body">
      <div className="nav-section">
        <div className="nav-heading">Curriculum</div>
        {LEVELS.map((level) => {
          const concepts = LEVEL_CONCEPTS[level.index] ?? [];
          const s = ready ? summarise(state, concepts) : null;
          return (
            <Link
              key={level.id}
              href={`/levels/${level.index}`}
              className="nav-link"
              aria-current={isCurrent(`/levels/${level.index}`) ? 'page' : undefined}
            >
              <span className="nav-num">{level.index}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{level.name}</span>
              {s && s.percent > 0 && (
                <span className="tiny faint tnum" aria-label={`${s.percent} percent`}>
                  {s.percent}%
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="nav-section">
        <div className="nav-heading">Library</div>
        {LIBRARY.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-link"
            aria-current={isCurrent(item.href) ? 'page' : undefined}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-heading">Practice</div>
        {PRACTICE.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-link"
            aria-current={isCurrent(item.href) ? 'page' : undefined}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-heading">About</div>
        <Link
          href="/sources"
          className="nav-link"
          aria-current={isCurrent('/sources') ? 'page' : undefined}
        >
          <span style={{ flex: 1 }}>Sources &amp; evidence</span>
        </Link>
        <Link
          href="/progress"
          className="nav-link"
          aria-current={isCurrent('/progress') ? 'page' : undefined}
        >
          <span style={{ flex: 1 }}>Your progress</span>
        </Link>
      </div>
      </div>
    </nav>
  );
}
