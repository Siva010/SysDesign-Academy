'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LEVELS } from '@/content/curriculum';
import { useProgress } from '@/lib/progress';
import { lessonsByLevel, levelStanding } from '@/lib/lesson-index';
import type { LessonIndexEntry } from '@/lib/types';

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

export function Sidebar({ index }: { index: LessonIndexEntry[] }) {
  const pathname = usePathname();
  const { recordsOf, ready } = useProgress();
  const [open, setOpen] = useState(false);

  /* On narrow screens the nav is collapsed so the content is the first thing on screen.
     Navigating closes it, or the menu covers the page you just asked for. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const records = recordsOf('lesson');
  const byLevel = lessonsByLevel(index);

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
          /* Read count rather than a percentage. "4/7" says what it is; a percentage of an
             inferred understanding said something the application could not actually know. */
          const s = ready ? levelStanding(byLevel.get(level.index) ?? [], records) : null;
          return (
            <Link
              key={level.id}
              href={`/levels/${level.index}`}
              className="nav-link"
              aria-current={isCurrent(`/levels/${level.index}`) ? 'page' : undefined}
            >
              <span className="nav-num">{level.index}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{level.name}</span>
              {s && s.due > 0 && (
                <span className="chip chip-warn tiny" aria-label={`${s.due} due for another pass`}>
                  {s.due}
                </span>
              )}
              {s && s.read > 0 && (
                <span className="tiny faint tnum" aria-label={`${s.read} of ${s.total} read`}>
                  {s.read}/{s.total}
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
