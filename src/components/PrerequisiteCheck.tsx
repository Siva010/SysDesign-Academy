'use client';

import Link from 'next/link';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { useProgress } from '@/lib/progress';

/**
 * Warns when the learner has not met the prerequisites for this lesson.
 *
 * This is a nudge, never a lock. Gating content behind prerequisites punishes the learner
 * who arrived from a search result with a real problem to solve; telling them what they
 * are missing helps them decide for themselves.
 */
export function PrerequisiteCheck({
  prerequisites,
  note,
}: {
  prerequisites: string[];
  note?: string;
}) {
  const { mastery, ready } = useProgress();

  if (prerequisites.length === 0) return null;

  const conceptPrereqs = prerequisites.filter((p) => CONCEPT_BY_ID[p]);
  const missing = ready ? conceptPrereqs.filter((p) => mastery(p) < 2) : [];

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
        not worked through yet. You can read on regardless, but these are where the reasoning
        comes from:
      </p>
      <ul className="tight" style={{ marginBottom: note ? '0.75rem' : 0 }}>
        {missing.map((id) => {
          const c = CONCEPT_BY_ID[id];
          if (!c) return null;
          return (
            <li key={id}>
              <Link href={`/concepts/${id}`}>{c.name}</Link>
              <span className="muted"> — {c.oneLiner}</span>
            </li>
          );
        })}
      </ul>
      {note && <p style={{ marginBottom: 0 }}>{note}</p>}
    </div>
  );
}
