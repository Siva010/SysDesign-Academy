'use client';

import { useState } from 'react';
import { useProgress, type PassKind } from '@/lib/progress';
import {
  type Pace,
  dueAt,
  nextPass,
  passLabel,
  relativeDays,
  statusOf,
} from '@/lib/passes';

/**
 * Marking a lesson or case study as read, and the rotation that follows.
 *
 * Three deliberate choices here.
 *
 * It is a **button**, not a scroll observer. The previous version marked a lesson read when its
 * footer came into view, which recorded scrolling rather than reading and could not be undone.
 * A claim about what you have read should be one you actually made.
 *
 * The **job of the next pass** is shown before you do it, not after. Re-reading feels useless
 * mostly when the second pass is performed identically to the first, so the panel says what is
 * different about this one - the trade-offs you skimmed, the argument you cannot yet reconstruct.
 *
 * And the schedule is **adjustable but not clever**. Sooner and later are the only two controls,
 * they are the learner's judgment rather than the software's, and there is nothing else deciding
 * anything behind them.
 */
export function PassControl({
  kind,
  id,
  nextHref,
  nextLabel,
}: {
  kind: PassKind;
  id: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  const { recordFor, markRead, undoRead, setPace, ready } = useProgress();
  const [justMarked, setJustMarked] = useState(false);

  /* Storage has not been read yet on the first paint. Render the frame at its final size so
     the end of the page does not jump once it arrives. */
  if (!ready) return <div className="pass-panel" style={{ minHeight: '9rem' }} aria-hidden />;

  const record = recordFor(kind, id);
  const reads = record?.reads ?? 0;
  const pass = nextPass(record);
  const status = statusOf(record);
  const noun = kind === 'lesson' ? 'lesson' : 'case study';

  const statusLine = () => {
    if (!record) return `You have not marked this ${noun} as read.`;
    if (status === 'resting') return `Next pass ${relativeDays(dueAt(record))}.`;
    if (status === 'due') return 'Due for another pass.';
    return `Overdue — due ${relativeDays(dueAt(record))}.`;
  };

  return (
    <div className="pass-panel" id="lesson-complete">
      <div className="pass-panel-head">
        <div>
          <div className="eyebrow">{pass.name}</div>
          <strong>{passLabel(reads)}</strong>
        </div>
        <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
          <span className="pass-pips" aria-label={`${reads} passes completed`}>
            {Array.from({ length: Math.min(reads, 5) }).map((_, i) => (
              <span key={i} className="pass-pip" />
            ))}
            {reads === 0 && <span className="pass-pip empty" />}
            {reads > 5 && <span className="pass-more">+{reads - 5}</span>}
          </span>
          {record && <span className={`pass-status ${status}`}>{statusLine()}</span>}
        </div>
      </div>

      <p className="pass-job">{pass.job}</p>

      <div className="pass-actions">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => {
            markRead(kind, id);
            setJustMarked(true);
          }}
        >
          {reads === 0 ? 'Mark as read' : 'Mark as read again'}
        </button>

        {nextHref && (
          <a href={nextHref} className="btn btn-sm">
            {nextLabel ?? 'Next'}
          </a>
        )}

        {record && (
          <>
            <span className="tiny faint" aria-hidden>
              ·
            </span>
            <span className="tiny faint">Bring it back</span>
            {(['sooner', 'later'] as Pace[]).map((p) => (
              <button
                key={p}
                type="button"
                className="pass-tweak"
                aria-pressed={record.pace === p}
                onClick={() => setPace(kind, id, record.pace === p ? undefined : p)}
              >
                {p}
              </button>
            ))}
            {justMarked && (
              <button
                type="button"
                className="pass-tweak"
                onClick={() => {
                  undoRead(kind, id);
                  setJustMarked(false);
                }}
              >
                undo
              </button>
            )}
          </>
        )}
      </div>

      {!record && (
        <p className="tiny faint" style={{ margin: '0.75rem 0 0' }}>
          Nothing is recorded until you say so, and nothing here is a score. The count exists so
          the {noun} can come back round.
        </p>
      )}
    </div>
  );
}
