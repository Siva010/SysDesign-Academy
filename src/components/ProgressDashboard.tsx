'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useProgress } from '@/lib/progress';
import { lessonsByLevel, levelStanding } from '@/lib/lesson-index';
import type { LessonIndexEntry } from '@/lib/types';
import {
  INTERVAL_DAYS,
  PASSES,
  type PassRecord,
  dueAt,
  passLabel,
  relativeDays,
  statusOf,
  urgency,
} from '@/lib/passes';

export interface LevelLite {
  index: number;
  name: string;
}

export interface ItemLite {
  id: string;
  title: string;
}

/**
 * Where the learner stands, in the only terms the application can honestly use.
 *
 * The previous dashboard reported inferred mastery across 297 concepts, which looked
 * authoritative and was mostly an artefact of how many multiple-choice checks someone had
 * clicked. This reports what was recorded: what has been read, how many times, and what is due.
 *
 * The rotation histogram is the view worth having. A curriculum this long is not finished by
 * reaching the end of it once, and the shape of that histogram - a wall at one pass, or a spread
 * across four - says more about where somebody is than any single percentage could.
 */
export function ProgressDashboard({
  levels,
  index,
  caseStudies,
}: {
  levels: LevelLite[];
  index: LessonIndexEntry[];
  caseStudies: ItemLite[];
}) {
  const { recordsOf, state, ready, reset, exportState, importState } = useProgress();
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!ready) return <div style={{ minHeight: '24rem' }} aria-hidden />;

  const lessonRecords = recordsOf('lesson');
  const studyRecords = recordsOf('case-study');
  const byLevel = lessonsByLevel(index);

  const all: { id: string; title: string; record: PassRecord; href: string }[] = [
    ...index
      .filter((l) => lessonRecords[l.id])
      .map((l) => ({ id: l.id, title: l.title, record: lessonRecords[l.id]!, href: `/lessons/${l.id}/` })),
    ...caseStudies
      .filter((c) => studyRecords[c.id])
      .map((c) => ({ id: c.id, title: c.title, record: studyRecords[c.id]!, href: `/case-studies/${c.id}/` })),
  ];

  const totalPasses = all.reduce((n, x) => n + x.record.reads, 0);
  const due = all
    .filter((x) => {
      const s = statusOf(x.record);
      return s === 'due' || s === 'overdue';
    })
    .sort((a, b) => urgency(b.record) - urgency(a.record));

  /* Buckets 1..4 exactly, then 5-and-up, matching the named passes. */
  const histogram = [1, 2, 3, 4, 5].map((n) => ({
    passes: n,
    label: PASSES[Math.min(n - 1, PASSES.length - 1)]!.name,
    count: all.filter((x) => (n === 5 ? x.record.reads >= 5 : x.record.reads === n)).length,
  }));
  const tallest = Math.max(1, ...histogram.map((h) => h.count));

  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sysdesign-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      <section>
        <div className="stat-row">
          <Stat value={all.length} label="things read" />
          <Stat value={totalPasses} label="passes made" />
          <Stat value={due.length} label="due now" tone={due.length > 0 ? 'warn' : undefined} />
          <Stat value={state.interviews.length} label="interviews run" />
        </div>
        {all.length === 0 && (
          <p className="muted" style={{ marginTop: '1rem' }}>
            Nothing recorded yet. Mark a lesson as read at the bottom of its page and it will
            appear here, then come back round on its own.
          </p>
        )}
      </section>

      {all.length > 0 && (
        <section>
          <h2 className="section-title">The rotation</h2>
          <p className="muted">
            How many things sit at each pass. A wall on the left means you have covered ground once;
            a spread to the right means it is starting to stick.
          </p>
          <div className="rotation">
            {histogram.map((h) => (
              <div key={h.passes} className="rotation-row">
                <span className="rotation-label">
                  {h.passes === 5 ? '5+' : h.passes} <span className="faint">{h.label}</span>
                </span>
                <div className="rotation-track">
                  <div
                    className="rotation-bar"
                    style={{ width: `${(h.count / tallest) * 100}%` }}
                    aria-hidden
                  />
                </div>
                <span className="tnum tiny faint">{h.count}</span>
              </div>
            ))}
          </div>
          <p className="tiny faint" style={{ marginTop: '0.75rem' }}>
            Intervals expand with each pass: {INTERVAL_DAYS.join(', ')} days, then every{' '}
            {INTERVAL_DAYS[INTERVAL_DAYS.length - 1]}.
          </p>
        </section>
      )}

      {due.length > 0 && (
        <section>
          <h2 className="section-title">Due for another pass</h2>
          <div className="stack">
            {due.slice(0, 10).map((x) => (
              <Link key={x.id} href={x.href} className="list-row">
                <div className="list-row-head">
                  <span>{x.title}</span>
                  <span className="tiny faint tnum">
                    {passLabel(x.record.reads)} · due {relativeDays(dueAt(x.record))}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {due.length > 10 && (
            <p className="tiny faint">and {due.length - 10} more.</p>
          )}
        </section>
      )}

      <section>
        <h2 className="section-title">By level</h2>
        <div className="stack">
          {levels.map((level) => {
            const lessons = byLevel.get(level.index) ?? [];
            const s = levelStanding(lessons, lessonRecords);
            return (
              <Link key={level.index} href={`/levels/${level.index}/`} className="list-row">
                <div className="list-row-head">
                  <span>
                    <span className="nav-num">{level.index}</span> {level.name}
                  </span>
                  <span className="tiny faint tnum">
                    {s.read}/{s.total} read
                    {s.revisited > 0 && ` · ${s.revisited} revisited`}
                    {s.due > 0 && ` · ${s.due} due`}
                  </span>
                </div>
                <div className="progress-track" style={{ marginTop: '0.4rem' }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${s.total ? (s.read / s.total) * 100 : 0}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">Your data</h2>
        <p className="muted">
          Everything above lives in this browser and nowhere else. It is not sent anywhere, and
          clearing site data deletes it — so export it if you care about it.
        </p>
        <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={download}>
            Export
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (window.confirm('Delete every recorded pass? This cannot be undone.')) reset();
            }}
          >
            Reset
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const ok = importState(await file.text());
              setImportError(ok ? null : 'That file was not recognised as saved progress.');
              e.target.value = '';
            }}
          />
        </div>
        {importError && (
          <p className="small" style={{ color: 'var(--danger)' }}>
            {importError}
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: 'warn' }) {
  return (
    <div className="stat">
      <div className="stat-value tnum" style={tone ? { color: 'var(--warn)' } : undefined}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
