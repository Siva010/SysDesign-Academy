'use client';

import { summarise, useProgress } from '@/lib/progress';

/**
 * Progress for a set of concepts.
 *
 * Shows three numbers rather than one, because a single percentage hides the distinction
 * that matters: having read about something is not the same as having used it.
 */
export function LevelProgress({ concepts }: { concepts: string[] }) {
  const { state, ready } = useProgress();

  if (!ready || concepts.length === 0) {
    return <div style={{ minWidth: '9rem' }} aria-hidden />;
  }

  const s = summarise(state, concepts);

  if (s.seen === 0) {
    return (
      <div style={{ minWidth: '9rem', textAlign: 'right' }}>
        <span className="tiny faint">{concepts.length} concepts</span>
      </div>
    );
  }

  return (
    <div style={{ minWidth: '9rem', textAlign: 'right' }}>
      <div className="progress-track" style={{ marginBottom: 4 }}>
        <div className="progress-fill" style={{ width: `${s.percent}%` }} />
      </div>
      <span className="tiny faint tnum">
        {s.solid} applied · {s.understood} understood · {s.total} total
      </span>
    </div>
  );
}
