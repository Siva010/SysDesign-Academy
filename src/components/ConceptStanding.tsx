'use client';

import Link from 'next/link';
import type { LessonIndexEntry } from '@/lib/types';
import { useProgress } from '@/lib/progress';
import { lessonsByConcept } from '@/lib/lesson-index';
import { passLabel, statusOf } from '@/lib/passes';

/**
 * Where a concept stands, derived from the lessons that teach it.
 *
 * This replaces a five-level mastery display whose levels the software assigned from check
 * answers. The honest version is much smaller: here is where this idea is taught, and here is
 * how many times you have been through those lessons. Nothing is inferred about whether you
 * understand it, because the application has no way to know that and said so anyway.
 */
export function ConceptStanding({
  conceptId,
  index,
}: {
  conceptId: string;
  index: LessonIndexEntry[];
}) {
  const { recordsOf, ready } = useProgress();
  if (!ready) return null;

  const records = recordsOf('lesson');
  const byConcept = lessonsByConcept(index);
  const teaching = byConcept.get(conceptId) ?? [];
  if (teaching.length === 0) return null;

  const titles = new Map(index.map((l) => [l.id, l.title]));
  const best = teaching.reduce((n, id) => Math.max(n, records[id]?.reads ?? 0), 0);
  const anyDue = teaching.some((id) => {
    const s = statusOf(records[id]);
    return s === 'due' || s === 'overdue';
  });

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="eyebrow">Where you have met this</div>
          <strong>{best === 0 ? 'In lessons you have not read yet' : passLabel(best)}</strong>
        </div>
        <span className="pass-pips" aria-label={`${best} passes`}>
          {Array.from({ length: Math.min(best, 5) }).map((_, i) => (
            <span key={i} className="pass-pip" />
          ))}
          {best === 0 && <span className="pass-pip empty" />}
          {best > 5 && <span className="pass-more">+{best - 5}</span>}
        </span>
      </div>

      <ul className="tight" style={{ margin: '0.75rem 0 0' }}>
        {teaching.map((id) => {
          const reads = records[id]?.reads ?? 0;
          return (
            <li key={id}>
              <Link href={`/lessons/${id}/`}>{titles.get(id) ?? id}</Link>{' '}
              <span className="tiny faint">{reads === 0 ? 'unread' : passLabel(reads).toLowerCase()}</span>
            </li>
          );
        })}
      </ul>

      {anyDue && (
        <p className="small muted" style={{ margin: '0.75rem 0 0' }}>
          One of these is due for another pass.
        </p>
      )}
    </div>
  );
}
