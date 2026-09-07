'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { DECAY_DAYS, effectiveMastery, summarise, useProgress } from '@/lib/progress';

const LEVEL_MEANING = [
  { level: 1, name: 'Encountered', evidence: 'You read a lesson that teaches it.' },
  { level: 2, name: 'Understood', evidence: 'You answered a reasoning check about it correctly.' },
  {
    level: 3,
    name: 'Applied',
    evidence: 'You used it in an exercise or case study where it was not the subject.',
  },
  {
    level: 4,
    name: 'Transferred',
    evidence: 'You used it correctly in a system you had not seen before.',
  },
];

export function ProgressDashboard({
  levels,
}: {
  levels: { index: number; name: string; concepts: string[] }[];
}) {
  const { state, ready, reset, exportState, importState } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!ready) return <p className="muted">Reading your progress…</p>;

  const all = levels.flatMap((l) => l.concepts);
  const overall = summarise(state, all);
  const lessonsRead = Object.keys(state.lessonsRead).length;
  const caseStudies = Object.keys(state.caseStudiesCompleted).length;

  const decayed = Object.entries(state.concepts).filter(
    ([, p]) => p.mastery === 2 && effectiveMastery(p) < 2,
  );

  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system-design-academy-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    setImportMessage(
      importState(text) ? 'Progress imported.' : 'That file was not a valid progress export.',
    );
  };

  return (
    <div className="stack" style={{ gap: '2.5rem' }}>
      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Where you stand
        </h2>
        <div className="card-grid">
          <div className="card">
            <div className="eyebrow">Concepts applied</div>
            <strong style={{ fontSize: 'var(--text-2xl)' }} className="tnum">
              {overall.solid}
            </strong>
            <p className="small muted" style={{ margin: '0.25rem 0 0' }}>
              Used somewhere they were not being taught. This is the number that matters.
            </p>
          </div>
          <div className="card">
            <div className="eyebrow">Concepts understood</div>
            <strong style={{ fontSize: 'var(--text-2xl)' }} className="tnum">
              {overall.understood}
            </strong>
            <p className="small muted" style={{ margin: '0.25rem 0 0' }}>
              Reasoned about correctly at least once, out of {overall.total} in the graph.
            </p>
          </div>
          <div className="card">
            <div className="eyebrow">Lessons read</div>
            <strong style={{ fontSize: 'var(--text-2xl)' }} className="tnum">
              {lessonsRead}
            </strong>
            <p className="small muted" style={{ margin: '0.25rem 0 0' }}>
              Worth the least of the three. Reading is exposure, not skill.
            </p>
          </div>
          <div className="card">
            <div className="eyebrow">Case studies worked</div>
            <strong style={{ fontSize: 'var(--text-2xl)' }} className="tnum">
              {caseStudies}
            </strong>
            <p className="small muted" style={{ margin: '0.25rem 0 0' }}>
              Derivations you completed yourself.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          By level
        </h2>
        <div className="stack" style={{ gap: '0.5rem' }}>
          {levels.map((l) => {
            const s = summarise(state, l.concepts);
            return (
              <Link key={l.index} href={`/levels/${l.index}`} className="card level-card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>
                    <span className="faint tnum">{l.index}</span> {l.name}
                  </span>
                  <span className="tiny faint tnum">
                    {s.solid} / {s.understood} / {s.total}
                  </span>
                </div>
                <div className="progress-track" style={{ marginTop: '0.5rem' }}>
                  <div className="progress-fill" style={{ width: `${s.percent}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
        <p className="tiny faint" style={{ marginTop: '0.75rem' }}>
          Read as applied / understood / total.
        </p>
      </section>

      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          What the levels mean
        </h2>
        <div className="table-scroll">
          <table className="block-table">
            <thead>
              <tr>
                <th style={{ width: '3rem' }}>Level</th>
                <th style={{ width: '9rem' }}>Name</th>
                <th>Evidence required</th>
              </tr>
            </thead>
            <tbody>
              {LEVEL_MEANING.map((m) => (
                <tr key={m.level}>
                  <td className="mono tnum">{m.level}</td>
                  <td>{m.name}</td>
                  <td className="muted">{m.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: '0.75rem' }}>
          Understanding decays: a concept at level 2 drops back to level 1 after {DECAY_DAYS} days
          without reinforcement. Levels 3 and 4 do not decay, because doing something is stickier
          than reading about it.
        </p>
      </section>

      {decayed.length > 0 && (
        <section>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Decayed since you last used them
          </h2>
          <div className="chip-row">
            {decayed.map(([id]) => {
              const c = CONCEPT_BY_ID[id];
              if (!c) return null;
              return (
                <Link key={id} href={`/concepts/${id}`} className="chip chip-warn">
                  {c.name}
                </Link>
              );
            })}
          </div>
          <p className="small muted" style={{ marginTop: '0.75rem' }}>
            <Link href="/next">The recommender</Link> surfaces these first.
          </p>
        </section>
      )}

      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Your data
        </h2>
        <p className="small muted" style={{ maxWidth: '42rem' }}>
          Progress is stored in this browser only. There is no account and nothing is sent
          anywhere. That also means it is lost if you clear site data or switch device, so export
          it if you care about it.
        </p>
        <div className="row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-sm" onClick={download}>
            Export
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          {!confirmReset ? (
            <button type="button" className="btn btn-sm" onClick={() => setConfirmReset(true)}>
              Reset everything
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              >
                Yes, erase it
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </>
          )}
        </div>
        {importMessage && (
          <p className="small" style={{ marginTop: '0.75rem' }}>
            {importMessage}
          </p>
        )}
      </section>
    </div>
  );
}
