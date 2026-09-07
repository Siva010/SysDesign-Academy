'use client';

import { DECAY_DAYS, useProgress } from '@/lib/progress';

const LABELS = [
  'Not seen yet',
  'Encountered — you have read about it',
  'Understood — you reasoned about it correctly',
  'Applied — you used it where it was not being taught',
  'Transferred — you used it in an unfamiliar problem',
];

const EVIDENCE = [
  'Read a lesson that teaches it.',
  'Answer a reasoning check about it.',
  'Use it correctly in an exercise or case study.',
  'Use it in an interview simulation or a system you have not seen before.',
  'Nothing further. This is the top of the scale.',
];

/**
 * Shows the learner exactly what their mastery level means and what would raise it.
 * Being explicit about the evidence required is the point: it is what stops
 * "I read the article" from feeling like "I know this".
 */
export function ConceptMastery({ conceptId }: { conceptId: string }) {
  const { mastery, state, ready } = useProgress();
  if (!ready) return null;

  const level = mastery(conceptId);
  const raw = state.concepts[conceptId];
  const decayed = raw ? raw.mastery > level : false;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">Your mastery</div>
          <strong>{LABELS[level]}</strong>
        </div>
        <div className="mastery-dots" aria-label={`Mastery level ${level} of 4`}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`mastery-dot${i <= level ? ' on' : ''}`} />
          ))}
        </div>
      </div>
      {decayed && (
        <p className="small muted" style={{ margin: '0.5rem 0 0' }}>
          This had decayed: understanding drops a level after {DECAY_DAYS} days without
          reinforcement, which is roughly how memory works whether or not a website models it.
        </p>
      )}
      {level < 4 && (
        <p className="small muted" style={{ margin: '0.5rem 0 0' }}>
          <strong>To move up:</strong> {EVIDENCE[level]}
        </p>
      )}
    </div>
  );
}
