'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CONCEPT_BY_ID } from '@/content/concepts';
import {
  DIMENSION_LABEL,
  SCENARIOS,
  type Choice,
  type Dimension,
  type Phase,
  type Scenario,
} from '@/content/interviews';
import { useProgress } from '@/lib/progress';

interface Turn {
  phase: Phase;
  choice: Choice;
}

/**
 * The interview engine.
 *
 * Routing is adaptive within the script: a run of strong answers escalates to a harder
 * phase where the scenario defines one, and a run of weak answers routes back to
 * fundamentals. That is a real behaviour of human interviewers, and it is the part that
 * makes practising against this useful rather than merely a quiz.
 */
export function InterviewSimulator() {
  const { recordAnswer, recordInterview } = useProgress();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [phaseId, setPhaseId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [scores, setScores] = useState<Partial<Record<Dimension, number>>>({});
  const [finished, setFinished] = useState(false);
  const recorded = useRef(false);

  const phase = useMemo(
    () => (scenario && phaseId ? scenario.phases.find((p) => p.id === phaseId) : undefined),
    [scenario, phaseId],
  );

  const signal = useMemo(() => {
    const recent = turns.slice(-2);
    if (recent.length === 0) return 0;
    return recent.reduce(
      (s, t) => s + (t.choice.quality === 'strong' ? 1 : t.choice.quality === 'weak' ? -1 : 0),
      0,
    );
  }, [turns]);

  const start = (s: Scenario) => {
    setScenario(s);
    setPhaseId(s.startPhase);
    setTurns([]);
    setScores({});
    setFinished(false);
    recorded.current = false;
  };

  const finish = (allTurns: Turn[], finalScores: Partial<Record<Dimension, number>>) => {
    setFinished(true);
    if (recorded.current || !scenario) return;
    recorded.current = true;
    recordInterview({
      scenarioId: scenario.id,
      at: Date.now(),
      scores: finalScores as Record<string, number>,
      turns: allTurns.length,
    });
  };

  const answer = (choice: Choice) => {
    if (!scenario || !phase) return;

    const nextTurns = [...turns, { phase, choice }];
    const nextScores = { ...scores };
    for (const [dim, delta] of Object.entries(choice.scores)) {
      const d = dim as Dimension;
      nextScores[d] = (nextScores[d] ?? 0) + (delta ?? 0);
    }

    setTurns(nextTurns);
    setScores(nextScores);

    if (choice.concepts && choice.concepts.length > 0) {
      recordAnswer(
        choice.concepts,
        choice.quality === 'strong' ? 'full' : choice.quality === 'adequate' ? 'partial' : 'none',
        'interview',
      );
    }

    /* adaptive routing */
    const recentSignal =
      signal + (choice.quality === 'strong' ? 1 : choice.quality === 'weak' ? -1 : 0);
    let next = choice.next;
    if (!next) {
      if (recentSignal >= 2 && phase.nextIfStrong) next = phase.nextIfStrong;
      else if (recentSignal <= -1 && phase.nextIfWeak) next = phase.nextIfWeak;
      else next = phase.next;
    }

    if (!next) {
      finish(nextTurns, nextScores);
      setPhaseId(null);
    } else {
      setPhaseId(next);
    }
  };

  /* ------------------------------------------------------------------ picker */

  if (!scenario) {
    return (
      <div>
        <div className="callout callout-warn">
          <div className="callout-title">What this is, and what it is not</div>
          <p>
            This is a <strong>scripted interviewer with branching</strong>, not a language model.
            It cannot read a free-form answer. What it does do is present realistic
            underspecified prompts, react differently depending on the quality of your choice,
            escalate when you are doing well, drop back to fundamentals when you are not, and
            tell you afterwards which dimension you were weak on.
          </p>
          <p style={{ marginBottom: 0 }}>
            Use it the way you would use a flight simulator: the value is in the decisions and
            the debrief, not in the realism of the conversation. Say your answer out loud before
            you click it — the options are written the way a candidate actually speaks, and
            hearing yourself is half the exercise.
          </p>
        </div>

        <h2 className="section-title">Choose a scenario</h2>
        <div className="stack">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="card level-card"
              style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
              onClick={() => start(s)}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{s.title}</strong>
                <span className="row">
                  <span className="chip">{s.difficulty}</span>
                  <span className="tiny faint">{s.minutes} min</span>
                </span>
              </div>
              <p className="constraint" style={{ margin: '0.5rem 0 0.75rem' }}>
                &ldquo;{s.opening}&rdquo;
              </p>
              <div className="chip-row">
                {s.assesses.slice(0, 6).map((d) => (
                  <span key={d} className="chip">
                    {DIMENSION_LABEL[d]}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ report */

  if (finished) {
    return (
      <InterviewReport
        scenario={scenario}
        turns={turns}
        scores={scores}
        onRestart={() => {
          setScenario(null);
          setPhaseId(null);
          setTurns([]);
        }}
      />
    );
  }

  /* ------------------------------------------------------------------ running */

  return (
    <div className="sim">
      <div>
        <div className="sim-transcript">
          {turns.map((t, i) => (
            <div key={i}>
              <div className="sim-turn interviewer">
                <div className="sim-who">Interviewer</div>
                <div className="sim-what">{t.phase.prompt}</div>
              </div>
              <div className="sim-turn you" style={{ marginTop: '0.75rem' }}>
                <div className="sim-who">You</div>
                <div className="sim-what">{t.choice.text}</div>
              </div>
              <div className="sim-turn interviewer" style={{ marginTop: '0.75rem' }}>
                <div className="sim-who" />
                <div className="sim-what" style={{ color: 'var(--muted)' }}>
                  {t.choice.reaction}
                </div>
              </div>
            </div>
          ))}

          {phase && (
            <div>
              {phase.note && (
                <div className="sim-turn note">
                  <div className="sim-who">Note</div>
                  <div className="sim-what">{phase.note}</div>
                </div>
              )}
              <div className="sim-turn interviewer" style={{ marginTop: phase.note ? '0.75rem' : 0 }}>
                <div className="sim-who">Interviewer</div>
                <div className="sim-what">{phase.prompt}</div>
              </div>
              <div className="sim-choices">
                {phase.choices.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="sim-choice"
                    onClick={() => answer(c)}
                  >
                    {c.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="sim-side">
        <div className="card">
          <div className="eyebrow">In progress</div>
          <strong>{scenario.title}</strong>
          <p className="small muted" style={{ margin: '0.5rem 0 0' }}>
            {turns.length} exchange{turns.length === 1 ? '' : 's'} so far.
          </p>
          <p className="tiny faint" style={{ margin: '0.75rem 0 0' }}>
            Scores are hidden during the interview, exactly as they would be in a real one.
          </p>
          <button
            type="button"
            className="btn btn-sm"
            style={{ marginTop: '0.75rem' }}
            onClick={() => finish(turns, scores)}
            disabled={turns.length === 0}
          >
            End early and see the report
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ report */

function InterviewReport({
  scenario,
  turns,
  scores,
  onRestart,
}: {
  scenario: Scenario;
  turns: Turn[];
  scores: Partial<Record<Dimension, number>>;
  onRestart: () => void;
}) {
  const strong = turns.filter((t) => t.choice.quality === 'strong').length;
  const weak = turns.filter((t) => t.choice.quality === 'weak').length;

  /* Normalise each dimension to 0-100 against the best available answer per turn. */
  const maxima: Partial<Record<Dimension, number>> = {};
  for (const t of turns) {
    for (const c of t.phase.choices) {
      for (const [dim, delta] of Object.entries(c.scores)) {
        const d = dim as Dimension;
        maxima[d] = Math.max(maxima[d] ?? 0, delta ?? 0);
      }
    }
  }

  const rows = scenario.assesses
    .map((d) => {
      const max = maxima[d] ?? 0;
      const got = scores[d] ?? 0;
      if (max === 0) return null;
      return { dimension: d, percent: Math.max(0, Math.min(100, Math.round((got / max) * 100))) };
    })
    .filter((r): r is { dimension: Dimension; percent: number } => Boolean(r))
    .sort((a, b) => a.percent - b.percent);

  const weakest = rows.slice(0, 3);
  const conceptsToRevisit = Array.from(
    new Set(
      turns
        .filter((t) => t.choice.quality !== 'strong')
        .flatMap((t) => t.phase.choices.find((c) => c.quality === 'strong')?.concepts ?? []),
    ),
  );

  return (
    <div className="stack" style={{ gap: '2.5rem' }}>
      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Post-interview report — {scenario.title}
        </h2>
        <p className="muted">
          {strong} strong answer{strong === 1 ? '' : 's'}, {weak} weak, across {turns.length}{' '}
          exchange{turns.length === 1 ? '' : 's'}.
        </p>

        <div className="card">
          <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>
            By dimension
          </div>
          {rows.map((r) => (
            <div key={r.dimension} className="score-row">
              <div>
                <div className="small">{DIMENSION_LABEL[r.dimension]}</div>
                <div className="score-bar">
                  <span style={{ width: `${r.percent}%` }} />
                </div>
              </div>
              <span className="tnum tiny faint" style={{ textAlign: 'right' }}>
                {r.percent}%
              </span>
            </div>
          ))}
          <p className="tiny faint" style={{ margin: '0.75rem 0 0' }}>
            Measured against the strongest answer available at each turn, not against an
            absolute standard.
          </p>
        </div>
      </section>

      {weakest.length > 0 && (
        <section>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Where to focus
          </h2>
          <div className="stack">
            {weakest.map((r) => (
              <div key={r.dimension} className="card">
                <strong>{DIMENSION_LABEL[r.dimension]}</strong>
                <span className="chip" style={{ marginLeft: '0.5rem' }}>
                  {r.percent}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Turn by turn
        </h2>
        <div className="stack">
          {turns.map((t, i) => {
            const best = t.phase.choices.find((c) => c.quality === 'strong');
            return (
              <div key={i} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="eyebrow">{t.phase.kind}</span>
                  <span
                    className={
                      t.choice.quality === 'strong'
                        ? 'chip chip-ok'
                        : t.choice.quality === 'weak'
                          ? 'chip chip-danger'
                          : 'chip chip-warn'
                    }
                  >
                    {t.choice.quality}
                  </span>
                </div>
                <p className="constraint" style={{ margin: '0.5rem 0' }}>
                  {t.phase.prompt}
                </p>
                <p className="small" style={{ marginBottom: '0.5rem' }}>
                  <strong>You said:</strong> {t.choice.text}
                </p>
                <p className="small" style={{ marginBottom: '0.5rem' }}>
                  <strong>What that showed:</strong> {t.choice.coaching}
                </p>
                {t.choice.quality !== 'strong' && best && (
                  <div className="callout callout-ok" style={{ marginBottom: 0 }}>
                    <div className="callout-title">A stronger answer</div>
                    <p style={{ marginBottom: 0 }} className="small">
                      {best.text}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {conceptsToRevisit.length > 0 && (
        <section>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Concepts to revisit
          </h2>
          <div className="chip-row">
            {conceptsToRevisit.map((id) => {
              const c = CONCEPT_BY_ID[id];
              if (!c) return null;
              return (
                <Link key={id} href={`/concepts/${id}`} className="chip chip-accent">
                  {c.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="row">
        <button type="button" className="btn btn-primary" onClick={onRestart}>
          Run another interview
        </button>
        {scenario.caseStudyId && (
          <Link href={`/case-studies/${scenario.caseStudyId}`} className="btn">
            Study the full derivation
          </Link>
        )}
        <Link href="/method" className="btn">
          Review the method
        </Link>
      </div>
    </div>
  );
}
