'use client';

import { useId, useMemo, useState } from 'react';

/**
 * Architecture diagrams with progressive disclosure (brief section 16).
 *
 * Diagrams are declared, not drawn: columns of nodes plus edges. That keeps every diagram
 * in the curriculum visually consistent, keeps them theme-aware and responsive, and means
 * a lesson author writes intent rather than coordinates.
 *
 * `stages` implements the "do not show beginners 25 boxes" rule: each stage names the
 * subset of nodes visible and why it exists.
 */

export interface ArchNode {
  id: string;
  label: string;
  /** Second line, e.g. "3 replicas" or "stateless". */
  note?: string;
  tone?: 'default' | 'accent' | 'muted';
}

export interface ArchColumn {
  title?: string;
  nodes: ArchNode[];
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  tone?: 'default' | 'accent' | 'danger';
  /** Draw as a dashed return path (responses, async callbacks). */
  dashed?: boolean;
}

export interface ArchStage {
  label: string;
  /** Node ids visible at this stage. Edges between visible nodes are drawn automatically. */
  show: string[];
  /** Why these boxes exist. Every diagram must answer this. */
  because: string;
}

const NODE_W = 138;
const NODE_H = 46;
const NODE_H_NOTE = 56;
const COL_GAP = 62;
const ROW_GAP = 18;
const PAD = 14;
const TITLE_H = 22;

interface Placed extends ArchNode {
  x: number;
  y: number;
  h: number;
  col: number;
}

export function Arch({
  columns,
  edges = [],
  stages,
  caption,
}: {
  columns: ArchColumn[];
  edges?: ArchEdge[];
  stages?: ArchStage[];
  caption?: string;
}) {
  const uid = useId().replace(/[:]/g, '');
  const [stageIndex, setStageIndex] = useState(0);

  const visible = useMemo(() => {
    if (!stages || stages.length === 0) return null;
    return new Set(stages[Math.min(stageIndex, stages.length - 1)]?.show ?? []);
  }, [stages, stageIndex]);

  const { placed, width, height, hasTitles, shownColumns } = useMemo(() => {
    /*
     * Columns with nothing visible at this stage are dropped entirely and the rest close
     * up. Without this, an early stage renders as three boxes separated by the empty space
     * where later boxes will appear, which is exactly the confusion progressive disclosure
     * is meant to avoid.
     */
    const shownColumns = columns
      .map((col) => ({
        title: col.title,
        nodes: col.nodes.filter((n) => !visible || visible.has(n.id)),
      }))
      .filter((col) => col.nodes.length > 0);

    const hasTitles = shownColumns.some((c) => Boolean(c.title));
    const top = hasTitles ? TITLE_H : 0;

    const colHeights = shownColumns.map(
      (col) =>
        col.nodes.reduce((s, n) => s + (n.note ? NODE_H_NOTE : NODE_H), 0) +
        (col.nodes.length - 1) * ROW_GAP,
    );

    const bodyHeight = Math.max(NODE_H, ...colHeights);
    const placed: Placed[] = [];

    shownColumns.forEach((col, ci) => {
      let y = top + PAD + (bodyHeight - (colHeights[ci] ?? 0)) / 2;
      for (const n of col.nodes) {
        const h = n.note ? NODE_H_NOTE : NODE_H;
        placed.push({ ...n, x: PAD + ci * (NODE_W + COL_GAP), y, h, col: ci });
        y += h + ROW_GAP;
      }
    });

    const cols = Math.max(shownColumns.length, 1);
    return {
      placed,
      shownColumns,
      width: PAD * 2 + cols * NODE_W + (cols - 1) * COL_GAP,
      height: top + PAD * 2 + bodyHeight + 22,
      hasTitles,
    };
  }, [columns, visible]);

  const byId = useMemo(() => new Map(placed.map((p) => [p.id, p])), [placed]);

  /*
   * Edges bridge over nodes that this stage hides. If the author declares
   * browser -> dns -> transport -> server and the early stage shows only browser and server,
   * the connection is still drawn, carrying the label of the final hop (the one that
   * describes arriving at the target). Without this, an early stage shows disconnected boxes.
   */
  const drawnEdges = useMemo(() => {
    const outgoing = new Map<string, ArchEdge[]>();
    for (const e of edges) {
      const list = outgoing.get(e.from) ?? [];
      list.push(e);
      outgoing.set(e.from, list);
    }

    const out: ArchEdge[] = [];
    const emitted = new Set<string>();

    for (const e of edges) {
      if (!byId.has(e.from)) continue;

      /* walk forward through hidden nodes until a visible target is found */
      let current = e;
      const guard = new Set<string>([e.from]);
      while (!byId.has(current.to)) {
        if (guard.has(current.to)) break;
        guard.add(current.to);
        const next = outgoing.get(current.to)?.[0];
        if (!next) break;
        current = next;
      }
      if (!byId.has(current.to) || current.to === e.from) continue;

      const key = `${e.from}->${current.to}`;
      if (emitted.has(key)) continue;
      emitted.add(key);
      out.push({ ...current, from: e.from });
    }

    return out;
  }, [edges, byId]);

  const stage = stages?.[Math.min(stageIndex, stages.length - 1)];

  return (
    <figure className="diagram">
      {stages && stages.length > 1 && (
        <div className="diagram-controls" role="tablist" aria-label="Diagram detail level">
          {stages.map((s, i) => (
            <button
              key={s.label}
              type="button"
              role="tab"
              aria-selected={i === stageIndex}
              className={`btn btn-sm${i === stageIndex ? ' btn-primary' : ''}`}
              onClick={() => setStageIndex(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="diagram-body">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={caption ?? 'Architecture diagram'}
        >
          <defs>
            <marker
              id={`arrow-${uid}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--line-strong)" />
            </marker>
            <marker
              id={`arrow-accent-${uid}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--accent)" />
            </marker>
            <marker
              id={`arrow-danger-${uid}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--danger)" />
            </marker>
          </defs>

          {hasTitles &&
            shownColumns.map((col, ci) =>
              col.title ? (
                <text
                  key={ci}
                  className="node-sub"
                  x={PAD + ci * (NODE_W + COL_GAP) + NODE_W / 2}
                  y={13}
                  textAnchor="middle"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  {col.title}
                </text>
              ) : null,
            )}

          {drawnEdges.map((e, i) => {
            const a = byId.get(e.from)!;
            const b = byId.get(e.to)!;
            const marker =
              e.tone === 'accent'
                ? `url(#arrow-accent-${uid})`
                : e.tone === 'danger'
                  ? `url(#arrow-danger-${uid})`
                  : `url(#arrow-${uid})`;
            const cls =
              e.tone === 'accent' ? 'edge edge-accent' : e.tone === 'danger' ? 'edge edge-danger' : 'edge';

            let d: string;
            let labelX: number;
            let labelY: number;

            if (a.col === b.col) {
              /* same column: route around the right side */
              const x = a.x + NODE_W;
              const y1 = a.y + a.h / 2;
              const y2 = b.y + b.h / 2;
              const bulge = 22;
              d = `M ${x} ${y1} C ${x + bulge} ${y1}, ${x + bulge} ${y2}, ${x} ${y2}`;
              labelX = x + bulge + 4;
              labelY = (y1 + y2) / 2;
            } else if (b.col > a.col) {
              const x1 = a.x + NODE_W;
              const y1 = a.y + a.h / 2;
              const x2 = b.x;
              const y2 = b.y + b.h / 2;
              const mid = (x1 + x2) / 2;
              d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
              labelX = mid;
              labelY = (y1 + y2) / 2 - 5;
            } else {
              /* backward edge: bow under the boxes */
              const x1 = a.x;
              const y1 = a.y + a.h / 2;
              const x2 = b.x + NODE_W;
              const y2 = b.y + b.h / 2;
              const dip = Math.max(a.y + a.h, b.y + b.h) + 16;
              d = `M ${x1} ${y1} C ${x1 - 30} ${dip}, ${x2 + 30} ${dip}, ${x2} ${y2}`;
              labelX = (x1 + x2) / 2;
              labelY = dip - 2;
            }

            return (
              <g key={`${e.from}-${e.to}-${i}`}>
                <path
                  className={cls}
                  d={d}
                  markerEnd={marker}
                  strokeDasharray={e.dashed ? '4 3' : undefined}
                />
                {e.label && (
                  <text className="edge-label" x={labelX} y={labelY} textAnchor="middle">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {placed.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={NODE_W}
                height={n.h}
                rx={4}
                className={
                  n.tone === 'accent'
                    ? 'node-box-accent'
                    : n.tone === 'muted'
                      ? 'node-box-muted'
                      : 'node-box'
                }
              />
              <text
                className="node-label"
                x={n.x + NODE_W / 2}
                y={n.note ? n.y + 22 : n.y + n.h / 2 + 4}
                textAnchor="middle"
              >
                {n.label}
              </text>
              {n.note && (
                <text className="node-sub" x={n.x + NODE_W / 2} y={n.y + 38} textAnchor="middle">
                  {n.note}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {(stage?.because || caption) && (
        <figcaption className="diagram-caption">
          {stage?.because ? (
            <>
              <strong>Why these boxes:</strong> {stage.because}
            </>
          ) : (
            caption
          )}
        </figcaption>
      )}
    </figure>
  );
}
