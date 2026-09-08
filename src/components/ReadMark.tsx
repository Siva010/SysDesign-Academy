'use client';

import { useProgress, type PassKind } from '@/lib/progress';
import { dueAt, passLabel, relativeDays, statusOf } from '@/lib/passes';

/**
 * The read marker on a lesson or case study in a list.
 *
 * Scanning a module list, the question is "which of these have I done?", and the answer wants to
 * be a glyph rather than a sentence. So: a tick when it has been read, the count beside it once
 * there is more than one pass, and the whole thing in the warning colour when it is due again.
 *
 * An unread item draws nothing, but still occupies the gutter. Reserving the space keeps the
 * titles in a column - a list where read rows are indented and unread ones are not looks like a
 * mistake - and it means the row does not shift sideways when localStorage arrives after the
 * first paint.
 */
export function ReadMark({ kind, id }: { kind: PassKind; id: string }) {
  const { recordFor, ready } = useProgress();
  const record = ready ? recordFor(kind, id) : undefined;

  if (!record) return <span className="read-mark empty" aria-hidden />;

  const status = statusOf(record);
  const isDue = status === 'due' || status === 'overdue';

  const label = isDue
    ? `${passLabel(record.reads)}, due ${relativeDays(dueAt(record))}`
    : `${passLabel(record.reads)}, next pass ${relativeDays(dueAt(record))}`;

  return (
    <span className={`read-mark${isDue ? ' due' : ''}`} title={label} aria-label={label}>
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden focusable="false">
        <path
          d="M2 6.4 L4.7 9 L10 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {record.reads > 1 && <span className="read-mark-count tnum">{record.reads}</span>}
    </span>
  );
}
