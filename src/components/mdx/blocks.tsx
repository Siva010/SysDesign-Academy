import Link from 'next/link';
import type { ClaimLabel } from '@/lib/types';
import { getSource } from '@/content/sources';
import { getConcept } from '@/content/concepts';

/* ------------------------------------------------------------------ evidence */

const CLAIM_STYLE: Record<ClaimLabel, { chip: string; label: string; title: string }> = {
  fact: { chip: 'chip chip-ok', label: 'Fact', title: 'Documented in a primary or textbook source' },
  convention: {
    chip: 'chip',
    label: 'Convention',
    title: 'What the industry commonly does, not a law',
  },
  recommendation: {
    chip: 'chip chip-accent',
    label: 'Recommendation',
    title: 'Our engineering opinion, with stated conditions',
  },
  simplification: {
    chip: 'chip chip-warn',
    label: 'Simplification',
    title: 'True enough at this level; refined later',
  },
  inference: { chip: 'chip chip-warn', label: 'Inference', title: 'Derived, not stated by the source' },
  speculation: {
    chip: 'chip chip-danger',
    label: 'Speculation',
    title: 'Plausible and unverified. Never a claim about a real company.',
  },
};

/**
 * Every non-obvious claim carries a visible label (docs/03-source-map.md).
 * The point is that the learner can always see how much weight a sentence can bear.
 */
export function Claim({
  label,
  source,
  children,
}: {
  label: ClaimLabel;
  source?: string;
  children: React.ReactNode;
}) {
  const style = CLAIM_STYLE[label];
  return (
    <div className="claim">
      <div className="claim-head">
        <span className={style.chip} title={style.title}>
          {style.label}
        </span>
        {source && <Cite id={source} />}
      </div>
      <div className="claim-body">{children}</div>
    </div>
  );
}

export function Cite({ id }: { id: string }) {
  const source = getSource(id);
  if (!source) return <span className="chip chip-danger">unknown source: {id}</span>;
  const body = (
    <>
      {source.title}
      {source.year ? ` (${source.year})` : ''}
    </>
  );
  return (
    <span className="cite tiny">
      {source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer noopener">
          {body}
        </a>
      ) : (
        body
      )}
      <span className="faint"> · tier {source.tier}</span>
    </span>
  );
}

/** Sources disagree. Say so, and say why, rather than merging them silently. */
export function Disagreement({
  about,
  positions,
  takeaway,
}: {
  about: string;
  positions: { source: string; says: string }[];
  takeaway: string;
}) {
  return (
    <div className="callout callout-warn">
      <div className="callout-title">Sources disagree: {about}</div>
      <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.1rem' }}>
        {positions.map((p, i) => (
          <li key={i}>
            <Cite id={p.source} /> — {p.says}
          </li>
        ))}
      </ul>
      <p style={{ margin: 0 }}>
        <strong>What to take away:</strong> {takeaway}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ callouts */

export function Callout({
  kind = 'info',
  title,
  children,
}: {
  kind?: 'info' | 'warn' | 'danger' | 'ok';
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className={`callout callout-${kind}`}>
      {title && <div className="callout-title">{title}</div>}
      {children}
    </aside>
  );
}

export function Example({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="callout callout-info">
      <div className="callout-title">{title ?? 'Concretely'}</div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ lesson sections */

export function ScaleTable({
  rows,
}: {
  rows: { scale: string; behaviour: string; firstToBreak: string }[];
}) {
  return (
    <div className="table-scroll">
      <table className="block-table">
        <thead>
          <tr>
            <th style={{ width: '7rem' }}>Scale</th>
            <th>What happens</th>
            <th>First thing to break</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="mono tnum">{r.scale}</td>
              <td>{r.behaviour}</td>
              <td className="muted">{r.firstToBreak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WhatBreaks({
  items,
}: {
  items: { what: string; symptom: string; cause: string; mitigation: string }[];
}) {
  return (
    <div className="stack breaks">
      {items.map((it, i) => (
        <div className="break-item" key={i}>
          <div className="break-title">{it.what}</div>
          <dl className="break-grid">
            <dt>Symptom</dt>
            <dd>{it.symptom}</dd>
            <dt>Cause</dt>
            <dd>{it.cause}</dd>
            <dt>Mitigation</dt>
            <dd>{it.mitigation}</dd>
          </dl>
        </div>
      ))}
    </div>
  );
}

/**
 * The nine-field trade-off (brief section 7). All fields are required by the prop type
 * precisely because the missing one is always "when should we NOT use it".
 */
export function TradeOff({
  decision,
  options,
  why,
  gain,
  sacrifice,
  failureModes,
  operationalBurden,
  cost,
  whenNot,
}: {
  decision: string;
  options: string[];
  why: string;
  gain: string;
  sacrifice: string;
  failureModes: string[];
  operationalBurden: string;
  cost: string;
  whenNot: string;
}) {
  return (
    <div className="tradeoff">
      <div className="tradeoff-head">
        <span className="eyebrow">Decision</span>
        <p className="tradeoff-decision">{decision}</p>
      </div>
      <dl className="tradeoff-grid">
        <dt>Options</dt>
        <dd>
          <ul className="tight">
            {options.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </dd>
        <dt>Why this one</dt>
        <dd>{why}</dd>
        <dt>What we gain</dt>
        <dd>{gain}</dd>
        <dt>What we sacrifice</dt>
        <dd>{sacrifice}</dd>
        <dt>Failure modes</dt>
        <dd>
          <ul className="tight">
            {failureModes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </dd>
        <dt>Operational burden</dt>
        <dd>{operationalBurden}</dd>
        <dt>Cost</dt>
        <dd>{cost}</dd>
        <dt className="strong-dt">When NOT to use it</dt>
        <dd className="strong-dd">{whenNot}</dd>
      </dl>
    </div>
  );
}

export function RealWorld({ children }: { children: React.ReactNode }) {
  return (
    <div className="callout callout-ok">
      <div className="callout-title">In production</div>
      {children}
    </div>
  );
}

export function InterviewLens({
  tests,
  depth,
  followUps,
}: {
  tests: string;
  depth: string;
  followUps: string[];
}) {
  return (
    <div className="lens">
      <div className="callout-title">The interview lens</div>
      <p>
        <strong>What is actually being tested:</strong> {tests}
      </p>
      <p>
        <strong>How deep to go:</strong> {depth}
      </p>
      <p style={{ marginBottom: '0.4rem' }}>
        <strong>Expect these follow-ups:</strong>
      </p>
      <ul className="tight">
        {followUps.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

export function Mistakes({
  items,
}: {
  items: { mistake: string; why: string; instead: string }[];
}) {
  return (
    <div className="stack">
      {items.map((m, i) => (
        <div className="mistake" key={i}>
          <p className="mistake-quote">“{m.mistake}”</p>
          <p className="small">
            <strong>Why this is weak:</strong> {m.why}
          </p>
          <p className="small" style={{ marginBottom: 0 }}>
            <strong>Stronger:</strong> {m.instead}
          </p>
        </div>
      ))}
    </div>
  );
}

export function GoDeeper({
  items,
}: {
  items: { label: string; sourceId?: string; href?: string; note?: string }[];
}) {
  return (
    <ul className="go-deeper">
      {items.map((it, i) => (
        <li key={i}>
          {it.href ? (
            <Link href={it.href}>{it.label}</Link>
          ) : (
            <strong>{it.label}</strong>
          )}
          {it.sourceId && (
            <>
              {' — '}
              <Cite id={it.sourceId} />
            </>
          )}
          {it.note && <div className="small muted">{it.note}</div>}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ links */

/** Inline link to a concept page, with its one-liner as a tooltip. */
export function C({ id, children }: { id: string; children?: React.ReactNode }) {
  const concept = getConcept(id);
  if (!concept) return <span className="chip chip-danger">unknown concept: {id}</span>;
  return (
    <Link href={`/concepts/${id}`} className="concept-link" title={concept.oneLiner}>
      {children ?? concept.name}
    </Link>
  );
}

export function Formula({
  expression,
  where,
}: {
  expression: string;
  where?: { symbol: string; meaning: string }[];
}) {
  return (
    <div className="formula">
      <div className="formula-expr mono">{expression}</div>
      {where && where.length > 0 && (
        <dl className="formula-where tiny">
          {where.map((w, i) => (
            <div key={i}>
              <dt className="mono">{w.symbol}</dt>
              <dd>{w.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
