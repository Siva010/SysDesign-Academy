'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CONCEPT_BY_ID, transitivePrerequisites } from '@/content/concepts';
import { CONCEPT_LEVEL } from '@/content/level-concepts';
import { DECAY_DAYS, useProgress } from '@/lib/progress';

export interface LessonLite {
  id: string;
  title: string;
  summary: string;
  level: number;
  minutes: number;
  concepts: string[];
  prerequisites: string[];
  sequence: number;
}

export interface Goal {
  id: string;
  label: string;
  description: string;
  targets: string[];
}

interface Recommendation {
  kind: 'unblock' | 'refresh' | 'goal' | 'sequence';
  lesson?: LessonLite;
  conceptId?: string;
  /** Always shown. The brief requires the recommendation to explain itself. */
  reason: string;
}

const KIND_LABEL: Record<Recommendation['kind'], string> = {
  unblock: 'Missing prerequisite',
  refresh: 'Needs reinforcement',
  goal: 'On the path to your goal',
  sequence: 'Next in order',
};

export function NextSteps({ lessons, goals }: { lessons: LessonLite[]; goals: Goal[] }) {
  const { state, mastery, setGoal, ready } = useProgress();
  const [showAll, setShowAll] = useState(false);

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!ready) return [];

    const out: Recommendation[] = [];
    const seenLessons = new Set<string>();

    const push = (r: Recommendation) => {
      if (r.lesson) {
        if (seenLessons.has(r.lesson.id)) return;
        seenLessons.add(r.lesson.id);
      }
      out.push(r);
    };

    const attempted = new Set(
      Object.entries(state.concepts)
        .filter(([, p]) => p.attempts > 0)
        .map(([id]) => id),
    );

    /* 1. prerequisites blocking something already attempted */
    for (const conceptId of attempted) {
      if (mastery(conceptId) >= 3) continue;
      for (const req of transitivePrerequisites(conceptId)) {
        if (mastery(req) >= 2) continue;
        const lesson = lessons.find((l) => l.concepts.includes(req));
        const blocked = CONCEPT_BY_ID[conceptId];
        const missing = CONCEPT_BY_ID[req];
        if (!blocked || !missing) continue;
        push({
          kind: 'unblock',
          lesson,
          conceptId: req,
          reason: `You have worked on ${blocked.name} but not ${missing.name}, which it depends on. This is usually why an explanation feels arbitrary rather than inevitable.`,
        });
      }
    }

    /* 2. understood but decayed */
    for (const [conceptId, p] of Object.entries(state.concepts)) {
      if (p.mastery !== 2) continue;
      if (mastery(conceptId) >= 2) continue;
      const c = CONCEPT_BY_ID[conceptId];
      if (!c) continue;
      const lesson = lessons.find((l) => l.concepts.includes(conceptId));
      push({
        kind: 'refresh',
        lesson,
        conceptId,
        reason: `You understood ${c.name} more than ${DECAY_DAYS} days ago and have not used it since. Reinforcing it now costs less than relearning it later.`,
      });
    }

    /* 3. shortest path to the stated goal */
    const goal = goals.find((g) => g.id === state.goal);
    if (goal) {
      for (const target of goal.targets) {
        if (mastery(target) >= 2) continue;
        const chain = [...transitivePrerequisites(target), target].filter((c) => mastery(c) < 2);
        const first = chain[0];
        if (!first) continue;
        const c = CONCEPT_BY_ID[first];
        const t = CONCEPT_BY_ID[target];
        if (!c || !t) continue;
        const lesson = lessons.find((l) => l.concepts.includes(first));
        push({
          kind: 'goal',
          lesson,
          conceptId: first,
          reason:
            first === target
              ? `You chose the goal "${goal.label}", and ${t.name} is directly on that path.`
              : `You chose the goal "${goal.label}", which needs ${t.name}. ${c.name} is the first thing missing on the way there.`,
        });
      }
    }

    /* 4. simply the next unread lesson in curriculum order */
    const nextUnread = lessons
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .find((l) => !state.lessonsRead[l.id]);
    if (nextUnread) {
      push({
        kind: 'sequence',
        lesson: nextUnread,
        reason:
          'The next lesson in curriculum order. Each level is built so the previous one has already made its limits obvious.',
      });
    }

    return out;
  }, [ready, state, mastery, lessons, goals]);

  const visible = showAll ? recommendations : recommendations.slice(0, 6);

  if (!ready) {
    return <p className="muted">Reading your progress…</p>;
  }

  const hasProgress = Object.keys(state.concepts).length > 0;

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          What are you preparing for?
        </h2>
        <p className="muted small">
          This changes the ordering, not the content. Everything stays available.
        </p>
        <div className="card-grid">
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`card level-card${state.goal === g.id ? ' option-active' : ''}`}
              style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
              onClick={() => setGoal(state.goal === g.id ? undefined : g.id)}
              aria-pressed={state.goal === g.id}
            >
              <strong>{g.label}</strong>
              <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
                {g.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Recommended next
        </h2>

        {!hasProgress && (
          <div className="callout callout-info">
            <p style={{ marginBottom: 0 }}>
              You have not read anything yet, so there is nothing to reason from. Start at Level 0
              and this page becomes useful once it has evidence to work with — recommendations
              based on nothing are just a table of contents.
            </p>
          </div>
        )}

        <div className="stack">
          {visible.map((r, i) => {
            const concept = r.conceptId ? CONCEPT_BY_ID[r.conceptId] : undefined;
            return (
              <div key={`${r.kind}-${r.lesson?.id ?? r.conceptId}-${i}`} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="chip chip-accent">{KIND_LABEL[r.kind]}</span>
                  {r.lesson && (
                    <span className="tiny faint">
                      Level {r.lesson.level} · {r.lesson.minutes} min
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: 'var(--text-md)' }}>
                  {r.lesson ? (
                    <Link href={`/lessons/${r.lesson.id}`}>{r.lesson.title}</Link>
                  ) : concept ? (
                    <Link href={`/concepts/${concept.id}`}>{concept.name}</Link>
                  ) : (
                    'Unknown'
                  )}
                </h3>
                {r.lesson && (
                  <p className="small muted" style={{ margin: '0 0 0.5rem' }}>
                    {r.lesson.summary}
                  </p>
                )}
                {!r.lesson && concept && (
                  <p className="small muted" style={{ margin: '0 0 0.5rem' }}>
                    {concept.oneLiner}{' '}
                    <span className="faint">
                      No lesson covers this yet
                      {typeof CONCEPT_LEVEL[concept.id] === 'number'
                        ? ` (it belongs to Level ${CONCEPT_LEVEL[concept.id]})`
                        : ''}
                      ; the concept page has the graph and the trade-offs.
                    </span>
                  </p>
                )}
                <p className="small" style={{ margin: 0 }}>
                  <strong>Why:</strong> {r.reason}
                </p>
              </div>
            );
          })}
        </div>

        {recommendations.length > 6 && (
          <button
            type="button"
            className="btn btn-sm"
            style={{ marginTop: '1rem' }}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show fewer' : `Show all ${recommendations.length}`}
          </button>
        )}
      </section>
    </div>
  );
}
