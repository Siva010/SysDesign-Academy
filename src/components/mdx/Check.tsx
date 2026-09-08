'use client';

import { useState } from 'react';
import type { ChoiceOption } from '@/lib/types';

/**
 * "Check yourself" (brief section 18).
 *
 * Deliberately never says "correct" or "incorrect". Every answer returns:
 *   1. what the answer implies about your model,
 *   2. why that model works or fails, mechanically,
 *   3. what a stronger candidate would add.
 *
 * A partially-credited answer is not a failure; it is usually the most instructive one,
 * because it is what a real candidate says.
 */
export function Check({
  prompt,
  options,
  stronger,
  concepts = [],
  context = 'lesson',
}: {
  prompt: string;
  options: ChoiceOption[];
  stronger: string;
  concepts?: string[];
  context?: 'lesson' | 'exercise' | 'case-study';
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  const selected = options.find((o) => o.id === chosen) ?? null;

  const choose = (opt: ChoiceOption) => {
    if (chosen) return;
    setChosen(opt.id);
  };

  return (
    <div className="check">
      <p className="check-prompt">{prompt}</p>

      <div className="check-options">
        {options.map((o) => {
          const isChosen = o.id === chosen;
          const reveal = chosen !== null;
          const tone =
            !reveal ? '' : o.credit === 'full' ? ' full' : o.credit === 'partial' ? ' partial' : ' none';
          return (
            <button
              key={o.id}
              type="button"
              className={`check-option${isChosen ? ' chosen' : ''}${tone}`}
              onClick={() => choose(o)}
              disabled={chosen !== null}
              aria-pressed={isChosen}
            >
              <span className="check-option-text">{o.text}</span>
              {reveal && (
                <span className="chip">
                  {o.credit === 'full'
                    ? 'strong'
                    : o.credit === 'partial'
                      ? 'partly right'
                      : 'misses it'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="check-feedback">
          <p>
            <strong>What this implies:</strong> {selected.implies}
          </p>
          <p>
            <strong>Why:</strong> {selected.why}
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>A stronger answer adds:</strong> {stronger}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * A free-response prompt with a rubric revealed after the learner commits an answer.
 * The rubric is the teaching material: it shows what a complete answer contains.
 */
export function OpenCheck({
  prompt,
  rubric,
  stronger,
  concepts = [],
}: {
  prompt: string;
  rubric: { point: string; weight: number; hint: string }[];
  stronger: string;
  concepts?: string[];
}) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [selfScore, setSelfScore] = useState<Set<number>>(new Set());

  const total = rubric.reduce((s, r) => s + r.weight, 0);
  const scored = rubric.reduce((s, r, i) => s + (selfScore.has(i) ? r.weight : 0), 0);
  const ratio = total === 0 ? 0 : scored / total;

  const toggle = (i: number) => {
    setSelfScore((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const commit = () => {
    setRevealed(true);
  };

  const finish = () => {
    const credit = ratio >= 0.75 ? 'full' : ratio >= 0.4 ? 'partial' : 'none';
  };

  return (
    <div className="check">
      <p className="check-prompt">{prompt}</p>

      <textarea
        rows={5}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer before revealing the rubric. Writing it down is the exercise."
        disabled={revealed}
        aria-label="Your answer"
      />

      {!revealed ? (
        <div className="row" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={commit}
            disabled={answer.trim().length < 20}
          >
            Reveal the rubric
          </button>
          <span className="tiny faint">
            {answer.trim().length < 20 ? 'Write at least a sentence first.' : 'Ready.'}
          </span>
        </div>
      ) : (
        <div className="check-feedback">
          <p className="small" style={{ marginBottom: '0.5rem' }}>
            <strong>A complete answer covers these. Tick the ones you actually said.</strong>
          </p>
          <ul className="rubric">
            {rubric.map((r, i) => (
              <li key={i}>
                <label>
                  <input
                    type="checkbox"
                    checked={selfScore.has(i)}
                    onChange={() => toggle(i)}
                  />
                  <span>
                    <strong>{r.point}</strong>
                    <span className="small muted"> — {r.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: '0.75rem' }}>
            <div className="progress-track" style={{ flex: 1, minWidth: '8rem' }}>
              <div className="progress-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
            <span className="tiny tnum faint">{Math.round(ratio * 100)}% covered</span>
            <button type="button" className="btn btn-sm" onClick={finish}>
              Record this
            </button>
          </div>
          <p className="small" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            <strong>A stronger answer adds:</strong> {stronger}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Estimation question: numeric, with a tolerance band, and a derivation revealed after.
 * Getting the order of magnitude right is the skill; the exact number is not.
 */
export function EstimateCheck({
  prompt,
  unit,
  answer,
  tolerance = 0.5,
  derivation,
  stronger,
  concepts = [],
}: {
  prompt: string;
  unit: string;
  answer: number;
  /** Fractional band, e.g. 0.5 accepts anything within a factor of 2. */
  tolerance?: number;
  derivation: string[];
  stronger: string;
  concepts?: string[];
}) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const parsed = Number(value.replace(/[, _]/g, ''));
  const valid = Number.isFinite(parsed) && parsed > 0;
  const ratio = valid ? parsed / answer : 0;
  const within = ratio >= 1 - tolerance && ratio <= 1 / (1 - tolerance);
  const orderOfMagnitude = valid && Math.abs(Math.log10(ratio)) < 1;

  const submit = () => {
    if (!valid) return;
    setSubmitted(true);
  };

  return (
    <div className="check">
      <p className="check-prompt">{prompt}</p>
      <div className="row">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your estimate"
          disabled={submitted}
          style={{ maxWidth: '12rem' }}
          aria-label="Your estimate"
        />
        <span className="small muted">{unit}</span>
        {!submitted && (
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={!valid}>
            Check
          </button>
        )}
      </div>

      {submitted && (
        <div className="check-feedback">
          <p>
            <strong>
              {within
                ? 'Within the band.'
                : orderOfMagnitude
                  ? 'Right order of magnitude, off by a factor.'
                  : 'Off by more than 10x.'}
            </strong>{' '}
            A defensible figure here is around{' '}
            <span className="mono tnum">{answer.toLocaleString()}</span> {unit}.
          </p>
          <p style={{ marginBottom: '0.4rem' }}>
            <strong>How you get there:</strong>
          </p>
          <ol className="tight small">
            {derivation.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ol>
          <p className="small" style={{ marginBottom: 0 }}>
            <strong>A stronger answer adds:</strong> {stronger}
          </p>
        </div>
      )}
    </div>
  );
}
