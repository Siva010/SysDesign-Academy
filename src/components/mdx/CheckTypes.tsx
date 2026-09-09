'use client';

import { useState } from 'react';
import type { ChoiceOption } from '@/lib/types';

/**
 * The four assessment types from docs/07-assessment-taxonomy.md that the base Check,
 * OpenCheck and EstimateCheck do not cover.
 *
 * All four obey the same feedback contract as Check: what your answer implies, why it works
 * or fails mechanically, and what a stronger answer adds. None of them ever say "correct".
 *
 * What distinguishes them from a plain multiple choice is the *material* they put in front
 * of the learner before the question: a resource table, a set of observations, a diagram
 * with a hole in it, or a system they have never seen. That material is the exercise; the
 * options are only how the answer is captured.
 */

/** Shared feedback block, so the contract is implemented once. */
function Feedback({ selected, stronger }: { selected: ChoiceOption; stronger: string }) {
  return (
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
  );
}

/** Shared option list. */
function Options({
  options,
  chosen,
  onChoose,
}: {
  options: ChoiceOption[];
  chosen: string | null;
  onChoose: (o: ChoiceOption) => void;
}) {
  return (
    <div className="check-options">
      {options.map((o) => {
        const reveal = chosen !== null;
        const tone = !reveal
          ? ''
          : o.credit === 'full'
            ? ' full'
            : o.credit === 'partial'
              ? ' partial'
              : ' none';
        return (
          <button
            key={o.id}
            type="button"
            className={`check-option${o.id === chosen ? ' chosen' : ''}${tone}`}
            onClick={() => onChoose(o)}
            disabled={reveal}
            aria-pressed={o.id === chosen}
          >
            <span className="check-option-text">{o.text}</span>
            {reveal && (
              <span className="chip">
                {o.credit === 'full' ? 'strong' : o.credit === 'partial' ? 'partly right' : 'misses it'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Bottleneck: find the limiting resource.
 *
 * The table is the point. Every row looks plausible and only one is at its ceiling, which is
 * the skill being tested — reading utilisation against capacity rather than reacting to the
 * largest absolute number.
 */
export function BottleneckCheck({
  prompt,
  resources,
  options,
  stronger,
  concepts = [],
}: {
  prompt: string;
  resources: { component: string; measured: string; capacity: string; note?: string }[];
  options: ChoiceOption[];
  stronger: string;
  concepts?: string[];
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = options.find((o) => o.id === chosen) ?? null;

  return (
    <div className="check">
      <div className="check-kind">Find the bottleneck</div>
      <p className="check-prompt">{prompt}</p>

      <div className="table-scroll">
        <table className="block-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Measured</th>
              <th>Capacity</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.component}>
                <td>
                  <strong>{r.component}</strong>
                </td>
                <td className="tnum">{r.measured}</td>
                <td className="tnum">{r.capacity}</td>
                <td className="small muted">{r.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Options
        options={options}
        chosen={chosen}
        onChoose={(o) => {
          if (chosen) return;
          setChosen(o.id);
        }}
      />

      {selected && <Feedback selected={selected} stronger={stronger} />}
    </div>
  );
}

/**
 * Debug: name the cause from symptoms.
 *
 * Observations are revealed on request rather than all at once, and the count is reported
 * back. Diagnosis is partly about which evidence you ask for, and a learner who commits
 * after two observations has demonstrated something a learner who read all six has not.
 */
export function DebugCheck({
  symptom,
  observations,
  options,
  stronger,
  concepts = [],
}: {
  symptom: string;
  /** Revealed one at a time, in order. Put the most diagnostic ones last. */
  observations: { label: string; detail: string }[];
  options: ChoiceOption[];
  stronger: string;
  concepts?: string[];
}) {
  const [revealed, setRevealed] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = options.find((o) => o.id === chosen) ?? null;

  return (
    <div className="check">
      <div className="check-kind">Diagnose it</div>
      <p className="check-prompt">{symptom}</p>

      <ul className="evidence">
        {observations.slice(0, revealed).map((o) => (
          <li key={o.label}>
            <strong>{o.label}</strong>
            <span className="small muted"> — {o.detail}</span>
          </li>
        ))}
      </ul>

      {revealed < observations.length && chosen === null && (
        <div className="row" style={{ marginBottom: 'var(--s3)' }}>
          <button type="button" className="btn btn-sm" onClick={() => setRevealed(revealed + 1)}>
            {revealed === 0 ? 'Ask for an observation' : 'Ask for another'}
          </button>
          <span className="tiny faint">
            {revealed} of {observations.length} used. Commit as early as you can defend.
          </span>
        </div>
      )}

      <Options
        options={options}
        chosen={chosen}
        onChoose={(o) => {
          if (chosen) return;
          setChosen(o.id);
        }}
      />

      {selected && (
        <>
          <div className="check-feedback" style={{ paddingBottom: 0, borderBottom: 0 }}>
            <p className="small faint" style={{ marginBottom: 0 }}>
              You committed after {revealed} of {observations.length} observations.
              {revealed === observations.length
                ? ' Reading everything is a fine way to be right and a slow way to be useful; in an incident the evidence costs minutes each.'
                : ' Narrowing the cause on partial evidence is the skill an incident actually demands.'}
            </p>
          </div>
          <Feedback selected={selected} stronger={stronger} />
        </>
      )}
    </div>
  );
}

/**
 * Complete: fill the hole in an architecture.
 *
 * The gap is shown in sequence with what surrounds it, because the answer is constrained by
 * its neighbours. Choosing a component is easy; choosing one that is coherent with what is
 * already on either side of it is the exercise.
 */
export function CompleteCheck({
  prompt,
  pipeline,
  options,
  stronger,
  concepts = [],
}: {
  prompt: string;
  /** In order. Exactly one entry should be the gap. */
  pipeline: { label: string; note?: string; gap?: boolean }[];
  options: ChoiceOption[];
  stronger: string;
  concepts?: string[];
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = options.find((o) => o.id === chosen) ?? null;

  return (
    <div className="check">
      <div className="check-kind">Complete the design</div>
      <p className="check-prompt">{prompt}</p>

      <div className="pipeline">
        {pipeline.map((p, i) => (
          <div key={`${p.label}-${i}`} className="pipeline-step">
            <div className={`pipeline-box${p.gap ? ' gap' : ''}`}>
              <strong>{p.gap && !selected ? '?' : p.label}</strong>
              {p.note && <span className="tiny faint">{p.note}</span>}
            </div>
            {i < pipeline.length - 1 && (
              <span className="pipeline-arrow" aria-hidden="true">
                →
              </span>
            )}
          </div>
        ))}
      </div>

      <Options
        options={options}
        chosen={chosen}
        onChoose={(o) => {
          if (chosen) return;
          setChosen(o.id);
        }}
      />

      {selected && <Feedback selected={selected} stronger={stronger} />}
    </div>
  );
}

/**
 * Transfer: a system the learner has never seen.
 *
 * The hardest of the check types, and the closest thing here to evidence that an idea has
 * actually generalised. It records nothing - no check does - because what a learner concludes
 * from getting it wrong is better information than a number. The question is never "how would
 * you build this" — it is "which problem that you already know is this one wearing new nouns".
 */
export function TransferCheck({
  system,
  prompt,
  options,
  stronger,
  concepts = [],
}: {
  /** The unfamiliar system, described in product terms with no technical vocabulary. */
  system: string;
  prompt: string;
  options: ChoiceOption[];
  stronger: string;
  concepts?: string[];
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = options.find((o) => o.id === chosen) ?? null;

  return (
    <div className="check">
      <div className="check-kind">Transfer</div>
      <blockquote className="transfer-system">{system}</blockquote>
      <p className="check-prompt">{prompt}</p>

      <Options
        options={options}
        chosen={chosen}
        onChoose={(o) => {
          if (chosen) return;
          setChosen(o.id);
        }}
      />

      {selected && <Feedback selected={selected} stronger={stronger} />}
    </div>
  );
}
