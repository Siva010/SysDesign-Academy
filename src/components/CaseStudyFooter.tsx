'use client';

import Link from 'next/link';
import { useProgress } from '@/lib/progress';

/**
 * Completing a case study is the evidence that moves concepts to mastery 3 (applied).
 * It is a deliberate click rather than a scroll trigger: the claim being made is
 * "I worked through this", and that should require asserting it.
 */
export function CaseStudyFooter({
  id,
  concepts,
  title,
}: {
  id: string;
  concepts: string[];
  title: string;
}) {
  const { state, completeCaseStudy, ready } = useProgress();
  const done = Boolean(state.caseStudiesCompleted[id]);

  return (
    <div className="callout callout-info" style={{ marginTop: '3rem' }}>
      <div className="callout-title">{done ? 'Marked as worked through' : 'Did you derive it?'}</div>
      <p>
        The value of a case study is in deriving it, not in reading it. If you read the pressure
        rounds without pausing to answer them first, the honest thing is to leave this unmarked
        and come back.
      </p>
      <div className="row" style={{ marginTop: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={!ready || done}
          onClick={() => completeCaseStudy(id, concepts)}
        >
          {done
            ? 'Recorded'
            : `I worked through this myself (${concepts.length} concepts to applied)`}
        </button>
        <Link href="/interview" className="btn btn-sm">
          Try it under interview pressure
        </Link>
      </div>
      {done && (
        <p className="small muted" style={{ margin: '0.75rem 0 0' }}>
          {title} recorded. To reach the top mastery level, use these ideas in a system you have
          not seen before — that is what the interview simulator is for.
        </p>
      )}
    </div>
  );
}
