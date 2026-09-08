'use client';

import type { LessonMeta } from '@/lib/types';
import { PassControl } from './PassControl';

/**
 * The end of a lesson: mark the pass, and go somewhere useful.
 *
 * The old version claimed reading was "mastery level 1" and told the learner what would raise
 * it. That framing is gone with the ladder it referred to. Re-reading is not a lesser form of
 * learning to be apologised for; it is the thing this curriculum is long enough to require.
 */
export function LessonFooter({ lesson }: { lesson: LessonMeta }) {
  const caseStudy = lesson.caseStudies?.[0];
  return (
    <PassControl
      kind="lesson"
      id={lesson.id}
      nextHref={caseStudy ? `/case-studies/${caseStudy}/` : '/next/'}
      nextLabel={caseStudy ? 'Work a case study' : 'What to read next'}
    />
  );
}
