'use client';

import { useState } from 'react';
import type { Decision } from '@/lib/types';

/**
 * The interactive part of a decision table.
 *
 * Selecting the constraints you are actually under tallies which option each one implies.
 * This is deliberately not a scoring algorithm that hands you an answer: it shows the tally
 * and leaves the judgment where it belongs. Two constraints pointing different ways is
 * information, not an error to be averaged away.
 */
export function DecisionTable({ decision }: { decision: Decision }) {
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [highlight, setHighlight] = useState<string | null>(null);

  const toggle = (i: number) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const tally = new Map<string, number>();
  for (const i of chosen) {
    const rule = decision.rules[i];
    if (!rule) continue;
    tally.set(rule.choose, (tally.get(rule.choose) ?? 0) + 1);
  }
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const conflicted = ranked.length > 1 && ranked[0]![1] === ranked[1]![1];

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          The options
        </h2>
        <div className="card-grid">
          {decision.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`card level-card${highlight === o.id ? ' option-active' : ''}`}
              style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
              onClick={() => setHighlight(highlight === o.id ? null : o.id)}
              aria-pressed={highlight === o.id}
            >
              <strong>{o.name}</strong>
              <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
                {o.oneLiner}
              </p>
              <p className="tiny faint" style={{ margin: '0.5rem 0 0' }}>
                {highlight === o.id ? 'showing where this wins' : 'click to highlight'}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          What actually differs
        </h2>
        <div className="table-scroll">
          <table className="block-table">
            <thead>
              <tr>
                <th style={{ minWidth: '11rem' }}>Criterion</th>
                {decision.options.map((o) => (
                  <th key={o.id}>{o.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decision.criteria.map((c) => (
                <tr key={c.criterion}>
                  <th scope="row">
                    {c.criterion}
                    {c.favours && (
                      <span className="tiny faint" style={{ display: 'block', fontWeight: 400 }}>
                        favours {decision.options.find((o) => o.id === c.favours)?.name}
                      </span>
                    )}
                  </th>
                  {decision.options.map((o) => {
                    const isFavoured = c.favours === o.id;
                    const isHighlighted = highlight === o.id;
                    return (
                      <td
                        key={o.id}
                        className={
                          isHighlighted && isFavoured
                            ? 'cell-win'
                            : isHighlighted
                              ? 'cell-dim'
                              : isFavoured
                                ? 'cell-favoured'
                                : undefined
                        }
                      >
                        {c.values[o.id] ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Constraint, consequence, choice
        </h2>
        <p className="small muted">
          Tick the constraints you are genuinely under. Not the ones you would like to be under.
        </p>
        <div className="stack" style={{ gap: '0.5rem' }}>
          {decision.rules.map((r, i) => {
            const option = decision.options.find((o) => o.id === r.choose);
            return (
              <label key={i} className={`rule${chosen.has(i) ? ' rule-on' : ''}`}>
                <input type="checkbox" checked={chosen.has(i)} onChange={() => toggle(i)} />
                <span>
                  <strong>{r.constraint}</strong>
                  <span className="small muted" style={{ display: 'block' }}>
                    {r.consequence}
                  </span>
                  <span className="chip chip-accent" style={{ marginTop: '0.35rem' }}>
                    → {option?.name ?? r.choose}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {chosen.size > 0 && (
          <div className="callout callout-info" style={{ marginTop: '1rem' }}>
            <div className="callout-title">Where your constraints point</div>
            <ul className="tight">
              {ranked.map(([optionId, count]) => (
                <li key={optionId}>
                  <strong>{decision.options.find((o) => o.id === optionId)?.name}</strong> —{' '}
                  {count} of your {chosen.size} constraint{chosen.size === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              {conflicted
                ? 'Your constraints conflict. That is the real finding: one of them is softer than you think, or the system needs to be split so that different parts can answer differently. Say that out loud in an interview — it is a stronger answer than picking one.'
                : 'A tally is not a decision. Check that the winning option survives the failure modes you care about before committing to it.'}
            </p>
          </div>
        )}
      </section>

      {decision.antiPattern && (
        <section>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            The reasoning this table exists to kill
          </h2>
          <div className="callout callout-danger">
            <p style={{ marginBottom: 0 }}>{decision.antiPattern}</p>
          </div>
        </section>
      )}
    </div>
  );
}
