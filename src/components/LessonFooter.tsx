'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { LessonMeta } from '@/lib/types';
import { useProgress } from '@/lib/progress';

/**
 * Marks a lesson as read and offers the honest framing: reading is mastery level 1.
 * Levels 3 and 4 only come from applying the idea somewhere it was not introduced.
 */
export function LessonFooter({ lesson }: { lesson: LessonMeta }) {
  const { state, markLessonRead, ready } = useProgress();
  const alreadyRead = Boolean(state.lessonsRead[lesson.id]);
  const marked = useRef(false);

  /* Mark on reaching the footer: scrolling here is better evidence than a button click. */
  useEffect(() => {
    if (!ready || alreadyRead || marked.current) return;
    const el = document.getElementById('lesson-complete');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !marked.current) {
            marked.current = true;
            markLessonRead(lesson.id, lesson.concepts);
          }
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ready, alreadyRead, lesson.id, lesson.concepts, markLessonRead]);

  return (
    <div id="lesson-complete" className="callout callout-info" style={{ marginTop: '3rem' }}>
      <div className="callout-title">
        {alreadyRead || marked.current ? 'Marked as read' : 'End of lesson'}
      </div>
      <p>
        Reading counts for very little on its own. In this curriculum a concept only reaches
        &ldquo;applied&rdquo; when you use it correctly somewhere it was not introduced — an
        exercise, a case study, or an interview simulation.
      </p>
      <div className="row" style={{ marginTop: '0.75rem' }}>
        <Link href="/next" className="btn btn-sm btn-primary">
          What should I learn next?
        </Link>
        {lesson.caseStudies && lesson.caseStudies.length > 0 && (
          <Link href={`/case-studies/${lesson.caseStudies[0]}`} className="btn btn-sm">
            Apply it in a case study
          </Link>
        )}
      </div>
    </div>
  );
}
