'use client';

import Link from 'next/link';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { useProgress } from '@/lib/progress';
import { lessonsByConcept } from '@/lib/lesson-index';
import type { LessonIndexEntry } from '@/lib/types';

/**
 * Warns when a lesson leans on ideas the learner has not read about yet.
 *
 * A nudge, never a lock. Gating content behind prerequisites punishes the learner who arrived
 * from a search result with a real problem to solve; telling them what they are missing lets
 * them decide for themselves.
 *
 * The test used to be a mastery threshold. It is now simply whether any lesson teaching the
 * prerequisite has been read, which is both weaker and true - and it can point at the lesson
 * to read rather than at a concept page describing a level.
 */
export function PrerequisiteCheck({
  prerequisites,
  note,
  index,
}: {
  prerequisites: string[];
  note?: string;
  index: LessonIndexEntry[];
}) {
  const { recordsOf, ready } = useProgress();

  if (prerequisites.length === 0) {
    return note ? (
      <div className="callout callout-info prereq-warning">
        <div className="callout-title">A note on prerequisites</div>
        <p style={{ marginBottom: 0 }}>{note}</p>
      </div>
    ) : null;
  }

  const records = recordsOf('lesson');
  const byConcept = lessonsByConcept(index);
  const titles = new Map(index.map((l) => [l.id, l.title]));

  const conceptPrereqs = prerequisites.filter((p) => CONCEPT_BY_ID[p]);
  const missing = ready
    ? conceptPrereqs.filter((p) => {
        const teaching = byConcept.get(p) ?? [];
        /* Nothing teaches it, so there is nothing to send them to and nothing to warn about. */
        if (teaching.length === 0) return false;
        return !teaching.some((id) => records[id]);
      })
    : [];

  if (!ready || missing.length === 0) {
    return note ? (
      <div className="callout callout-info prereq-warning">
        <div className="callout-title">A note on prerequisites</div>
        <p style={{ marginBottom: 0 }}>{note}</p>
      </div>
    ) : null;
  }

  return (
    <div className="callout callout-warn prereq-warning">
      <div className="callout-title">You may want these first</div>
      <p>
        This lesson assumes {missing.length === 1 ? 'one idea' : `${missing.length} ideas`} you have
        not read about yet. You can read on regardless, but this is where the reasoning comes from:
      </p>
      <ul className="tight" style={{ marginBottom: note ? '0.75rem' : 0 }}>
        {missing.map((id) => {
          const c = CONCEPT_BY_ID[id];
          if (!c) return null;
          const first = (byConcept.get(id) ?? [])[0];
          return (
            <li key={id}>
              <Link href={`/concepts/${id}/`}>{c.name}</Link>
              {first && (
                <>
                  {' — taught in '}
                  <Link href={`/lessons/${first}/`}>{titles.get(first) ?? first}</Link>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {note && <p style={{ marginBottom: 0 }}>{note}</p>}
    </div>
  );
}
