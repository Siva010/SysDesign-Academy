'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { useProgress } from '@/lib/progress';
import { type PassRecord, dueAt, passLabel, relativeDays, statusOf, urgency } from '@/lib/passes';

export interface LessonLite {
  id: string;
  title: string;
  summary: string;
  level: number;
  minutes: number;
  concepts: string[];
  prerequisites: string[];
  /** Position in curriculum order. */
  sequence: number;
}

export interface Goal {
  id: string;
  label: string;
  description: string;
  targets: string[];
}

interface Suggestion {
  lesson: LessonLite;
  reason: string;
  record?: PassRecord;
}

/**
 * What to read next.
 *
 * Three lists, in the order a learner actually needs them: what has come back round, what comes
 * next, and what a stated goal pulls forward. Every entry says why it is there, because a
 * recommender that cannot explain itself is a shuffled table of contents.
 *
 * The revision list is first deliberately. Under the previous model, revisiting was something
 * the software decided had happened to you when a number decayed. Here it is the main event, and
 * it only contains things you told it you had read.
 */
export function NextSteps({ lessons, goals }: { lessons: LessonLite[]; goals: Goal[] }) {
  const { recordsOf, ready } = useProgress();
  const [goalId, setGoalId] = useState<string | null>(null);
  const records = recordsOf('lesson');

  /** Concept id to the lessons teaching it, for the prerequisite note. */
  const teaches = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of lessons) {
      for (const c of l.concepts) {
        const list = m.get(c);
        if (list) list.push(l.id);
        else m.set(c, [l.id]);
      }
    }
    return m;
  }, [lessons]);

  const due: Suggestion[] = useMemo(() => {
    if (!ready) return [];
    return lessons
      .flatMap((lesson) => {
        const record = records[lesson.id];
        if (!record) return [];
        const status = statusOf(record);
        if (status !== 'due' && status !== 'overdue') return [];
        return [
          {
            lesson,
            record,
            reason: `${passLabel(record.reads)}, due ${relativeDays(dueAt(record))}.`,
          },
        ];
      })
      .sort((a, b) => urgency(b.record!) - urgency(a.record!))
      .slice(0, 5);
  }, [lessons, records, ready]);

  const unread = useMemo(
    () => (ready ? lessons.filter((l) => !records[l.id]) : []),
    [lessons, records, ready],
  );

  /** Prerequisite concepts with no read lesson behind them. A note, not a gate. */
  const missingFor = (lesson: LessonLite) =>
    lesson.prerequisites.filter((p) => {
      const t = teaches.get(p) ?? [];
      return t.length > 0 && !t.some((id) => records[id]);
    });

  const upNext: Suggestion[] = useMemo(() => {
    return unread.slice(0, 3).map((lesson) => {
      const missing = missingFor(lesson);
      return {
        lesson,
        reason:
          missing.length === 0
            ? 'Next in the curriculum, and you have read what it builds on.'
            : `Next in the curriculum. It leans on ${missing
                .slice(0, 2)
                .map((m) => CONCEPT_BY_ID[m]?.name ?? m)
                .join(' and ')}, which you have not read about yet.`,
      };
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [unread, records]);

  const goal = goals.find((g) => g.id === goalId);

  const forGoal: Suggestion[] = useMemo(() => {
    if (!goal) return [];
    const wanted = new Set(goal.targets);
    return unread
      .map((lesson) => ({
        lesson,
        hits: lesson.concepts.filter((c) => wanted.has(c)).length,
      }))
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits || a.lesson.sequence - b.lesson.sequence)
      .slice(0, 4)
      .map(({ lesson, hits }) => ({
        lesson,
        reason: `Teaches ${hits} of the ${goal.targets.length} ideas this goal is about.`,
      }));
  }, [goal, unread]);

  if (!ready) return <div style={{ minHeight: '20rem' }} aria-hidden />;

  const nothingRead = Object.keys(records).length === 0;

  return (
    <div className="stack">
      {nothingRead ? (
        <section>
          <h2 className="section-title">Start here</h2>
          <p className="muted">
            Nothing is recorded yet. Read a lesson, then mark it at the bottom of the page — that
            is the only thing this application knows about you, and it is the thing that brings a
            lesson back round later.
          </p>
          {lessons[0] && <SuggestionCard s={{ lesson: lessons[0], reason: 'The first lesson.' }} />}
        </section>
      ) : (
        <section>
          <h2 className="section-title">Due for another pass</h2>
          {due.length === 0 ? (
            <p className="muted">
              Nothing is due. Everything you have read is still resting — the intervals are 3, 10,
              30, 90 and 180 days, expanding with each pass.
            </p>
          ) : (
            <div className="stack">
              {due.map((s) => (
                <SuggestionCard key={s.lesson.id} s={s} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Suppressed on a fresh start, where "Start here" is already showing the same lesson. */}
      {!nothingRead && upNext.length > 0 && (
        <section>
          <h2 className="section-title">Carry on</h2>
          <div className="stack">
            {upNext.map((s) => (
              <SuggestionCard key={s.lesson.id} s={s} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Reorder for a goal</h2>
        <p className="muted">
          A goal changes the order and hides nothing. Each one names the ideas someone with that
          goal is most often missing.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`btn btn-sm${goalId === g.id ? ' btn-primary' : ''}`}
              aria-pressed={goalId === g.id}
              onClick={() => setGoalId(goalId === g.id ? null : g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        {goal && (
          <>
            <p className="small muted">{goal.description}</p>
            {forGoal.length === 0 ? (
              <p className="muted">
                You have read every lesson that teaches these. The revision list above is the
                useful thing now.
              </p>
            ) : (
              <div className="stack">
                {forGoal.map((s) => (
                  <SuggestionCard key={s.lesson.id} s={s} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const { lesson, reason, record } = s;
  return (
    <Link href={`/lessons/${lesson.id}/`} className="list-row">
      <div className="list-row-head">
        <span>{lesson.title}</span>
        <span className="tiny faint tnum">
          Level {lesson.level} · {lesson.minutes} min
          {record ? ` · ${passLabel(record.reads).toLowerCase()}` : ''}
        </span>
      </div>
      <div className="list-row-summary">{lesson.summary}</div>
      <div className="tiny faint" style={{ marginTop: '0.35rem' }}>
        {reason}
      </div>
    </Link>
  );
}
