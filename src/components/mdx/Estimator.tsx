'use client';

import { useMemo, useState } from 'react';
import { ESTIMATOR_BY_ID, type EstimatorPreset } from '@/content/estimators';

function formatBytes(n: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  let v = n;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v).toLocaleString()} ${units[i]}`;
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)} trillion`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)} billion`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)} million`;
  if (abs >= 1000) return Math.round(n).toLocaleString();
  if (abs >= 1) return n.toFixed(abs < 10 ? 2 : 1);
  if (abs >= 0.001) return n.toFixed(5).replace(/0+$/, '');
  return n.toExponential(2);
}

/** Log-scale slider position (0-1000) from a value, and back. */
function toSlider(value: number, min: number, max: number, log?: boolean): number {
  if (log) {
    const lo = Math.log10(min);
    const hi = Math.log10(max);
    return ((Math.log10(Math.max(value, min)) - lo) / (hi - lo)) * 1000;
  }
  return ((value - min) / (max - min)) * 1000;
}

function fromSlider(pos: number, min: number, max: number, log?: boolean): number {
  if (log) {
    const lo = Math.log10(min);
    const hi = Math.log10(max);
    return Math.pow(10, lo + (pos / 1000) * (hi - lo));
  }
  return min + (pos / 1000) * (max - min);
}

export function Estimator({
  preset,
  compact = false,
}: {
  preset: string;
  compact?: boolean;
}) {
  const def: EstimatorPreset | undefined = ESTIMATOR_BY_ID[preset];
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((def?.inputs ?? []).map((i) => [i.id, i.value])),
  );
  const [openNote, setOpenNote] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!def) return [];
    return def.rows.map((r) => {
      let value: number;
      try {
        value = r.compute(values);
      } catch {
        value = NaN;
      }
      return { row: r, value };
    });
  }, [def, values]);

  if (!def) {
    return <div className="callout callout-danger">Unknown estimator preset: {preset}</div>;
  }

  const reset = () =>
    setValues(Object.fromEntries(def.inputs.map((i) => [i.id, i.value])));

  const dirty = def.inputs.some((i) => values[i.id] !== i.value);

  return (
    <div className="estimator">
      <div className="estimator-head">
        <div>
          <strong>{def.title}</strong>
          {!compact && <p className="small muted" style={{ margin: '0.25rem 0 0' }}>{def.intro}</p>}
        </div>
        <button type="button" className="btn btn-sm" onClick={reset} disabled={!dirty}>
          Reset
        </button>
      </div>

      <div className="estimator-body">
        <div className="estimator-inputs">
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            Assumptions
          </div>
          {def.inputs.map((input) => {
            const v = values[input.id] ?? input.value;
            return (
              <div className="estimator-input" key={input.id}>
                <div className="estimator-input-head">
                  <label htmlFor={`est-${def.id}-${input.id}`}>{input.label}</label>
                  <span className="mono tnum small">
                    {input.log || v >= 1000 ? formatNumber(v) : v < 1 ? v.toFixed(4).replace(/0+$/, '') : v.toFixed(1)}
                    <span className="faint"> {input.unit}</span>
                  </span>
                </div>
                <input
                  id={`est-${def.id}-${input.id}`}
                  type="range"
                  min={0}
                  max={1000}
                  step={1}
                  value={toSlider(v, input.min, input.max, input.log)}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [input.id]: fromSlider(Number(e.target.value), input.min, input.max, input.log),
                    }))
                  }
                />
                {input.note && (
                  <>
                    <button
                      type="button"
                      className="estimator-why"
                      aria-expanded={openNote === input.id}
                      onClick={() => setOpenNote(openNote === input.id ? null : input.id)}
                    >
                      {openNote === input.id ? 'hide' : 'why this number?'}
                    </button>
                    {openNote === input.id && <p className="tiny muted estimator-note">{input.note}</p>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="estimator-results">
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            Derived
          </div>
          <table className="estimator-table">
            <tbody>
              {results.map(({ row, value }) => (
                <tr key={row.label} className={row.decisive ? 'decisive' : undefined}>
                  <th scope="row">
                    {row.label}
                    <span className="tiny faint estimator-derivation">{row.derivation}</span>
                  </th>
                  <td className="mono tnum">
                    {row.bytes ? formatBytes(value) : formatNumber(value)}
                    {row.unit && <span className="faint"> {row.unit}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!compact && (
        <div className="estimator-interpretation">
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            What these numbers mean for the design
          </div>
          <dl>
            {def.interpretation.map((it, i) => (
              <div key={i}>
                <dt>{it.when}</dt>
                <dd>{it.then}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
