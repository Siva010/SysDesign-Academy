'use client';

import type { LessonIndexEntry } from '@/lib/types';
import { useProgress } from '@/lib/progress';
import { levelStanding } from '@/lib/lesson-index';

/**
 * How far through a level the learner is, in lessons rather than in inferred understanding.
 *
 * The bar fills on lessons read at least once. Revisits are reported as a separate number
 * instead of pushing the bar past full, because "read all of them once" and "been round them
 * twice" are different states and averaging them into one percentage hides which one you are in.
 */
export function LevelProgress({ lessons }: { lessons: LessonIndexEntry[] }) {
  const { recordsOf, ready } = useProgress();

  if (!ready || lessons.length === 0) {
    return <div style={{ minWidth: '9rem' }} aria-hidden />;
  }

  const s = levelStanding(lessons, recordsOf('lesson'));

  if (s.read === 0) {
    return (
      <div style={{ minWidth: '9rem', textAlign: 'right' }}>
        <span className="tiny faint">{s.total} lessons</span>
      </div>
    );
  }

  const percent = Math.round((s.read / s.total) * 100);

  return (
    <div style={{ minWidth: '9rem', textAlign: 'right' }}>
      <div className="progress-track" style={{ marginBottom: 4 }}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="tiny faint tnum">
        {s.read} of {s.total} read
        {s.revisited > 0 && ` · ${s.revisited} revisited`}
        {s.due > 0 && ` · ${s.due} due`}
      </span>
    </div>
  );
}
