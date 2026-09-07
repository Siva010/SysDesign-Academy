import Link from 'next/link';
import { CONCEPT_BY_ID } from '@/content/concepts';

/**
 * The local neighbourhood of one concept, as a diagram.
 *
 * Deliberately *not* a force-directed view of the whole graph. A physics layout of 297 nodes
 * is a picture of a hairball: it looks like insight and answers no question. What a learner
 * actually wants to see is the shape immediately around where they are standing, and that has
 * a fixed reading:
 *
 *   what this needs   ->   [ this ]   ->   what it makes possible
 *                             |
 *                       what it trades against
 *
 * So the layout is deterministic — three bands, no simulation, same picture every time. The
 * tension row is the reason the diagram exists at all: requires and leads-to are already a
 * list, but "these two pull against each other" is a relationship a list cannot show.
 */

const NODE_W = 148;
const NODE_H = 34;
const GAP_Y = 12;
const COL_GAP = 92;
const PAD = 14;
const MAX_PER_GROUP = 5;

interface Placed {
  id: string;
  name: string;
  x: number;
  y: number;
}

/** Break a label to fit the box; two lines maximum, ellipsis after that. */
function wrap(label: string): string[] {
  if (label.length <= 20) return [label];
  const words = label.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > 20 && current) {
      lines.push(current);
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
    if (lines.length === 2) break;
  }
  if (lines.length < 2 && current) lines.push(current);
  if (lines.length === 2 && words.join(' ').length > lines.join(' ').length) {
    lines[1] = lines[1]!.slice(0, 18) + '…';
  }
  return lines;
}

function resolve(ids: string[]): { id: string; name: string }[] {
  return ids
    .map((id) => CONCEPT_BY_ID[id])
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ id: c.id, name: c.name }));
}

function column(items: { id: string; name: string }[], x: number, bandCentre: number): Placed[] {
  const total = items.length * NODE_H + Math.max(0, items.length - 1) * GAP_Y;
  const top = bandCentre - total / 2;
  return items.map((it, i) => ({
    ...it,
    x,
    y: top + i * (NODE_H + GAP_Y),
  }));
}

export function ConceptNeighbourhood({ id }: { id: string }) {
  const concept = CONCEPT_BY_ID[id];
  if (!concept) return null;

  const requiresAll = resolve(concept.requires ?? []);
  const leadsToAll = resolve(concept.leadsTo ?? []);
  const tensionsAll = resolve(concept.tensionWith ?? []);

  /* Nothing around it is not a diagram worth drawing. */
  if (requiresAll.length + leadsToAll.length + tensionsAll.length === 0) return null;

  const requires = requiresAll.slice(0, MAX_PER_GROUP);
  const leadsTo = leadsToAll.slice(0, MAX_PER_GROUP);
  const tensions = tensionsAll.slice(0, 3);

  const tallest = Math.max(requires.length, leadsTo.length, 1);
  const bandHeight = tallest * NODE_H + Math.max(0, tallest - 1) * GAP_Y;
  const bandCentre = PAD + bandHeight / 2;

  const colX = [PAD, PAD + NODE_W + COL_GAP, PAD + 2 * (NODE_W + COL_GAP)];

  const left = column(requires, colX[0]!, bandCentre);
  const right = column(leadsTo, colX[2]!, bandCentre);
  const centre: Placed = {
    id: concept.id,
    name: concept.name,
    x: colX[1]!,
    y: bandCentre - NODE_H / 2,
  };

  /* Tensions sit below the centre, spread horizontally, joined by dashed lines. */
  const tensionY = PAD + bandHeight + 54;
  const tensionSpan = tensions.length * NODE_W + Math.max(0, tensions.length - 1) * 20;
  const tensionStart = colX[1]! + NODE_W / 2 - tensionSpan / 2;
  const tensionNodes: Placed[] = tensions.map((t, i) => ({
    ...t,
    x: tensionStart + i * (NODE_W + 20),
    y: tensionY,
  }));

  const width = PAD * 2 + 3 * NODE_W + 2 * COL_GAP;
  const height = tensions.length > 0 ? tensionY + NODE_H + PAD : PAD * 2 + bandHeight;

  /* The viewBox may need to extend left when the tension row is wider than the columns. */
  const minX = Math.min(0, ...tensionNodes.map((n) => n.x - PAD));
  const maxX = Math.max(width, ...tensionNodes.map((n) => n.x + NODE_W + PAD));

  const box = (n: Placed, tone: 'plain' | 'accent') => {
    const lines = wrap(n.name);
    return (
      <Link key={`${tone}-${n.id}`} href={`/concepts/${n.id}`}>
        <rect
          x={n.x}
          y={n.y}
          width={NODE_W}
          height={NODE_H}
          rx={4}
          className={tone === 'accent' ? 'node-box-accent' : 'node-box'}
        />
        {lines.map((line, i) => (
          <text
            key={i}
            className="node-label"
            x={n.x + NODE_W / 2}
            y={n.y + NODE_H / 2 + (lines.length === 1 ? 4 : i === 0 ? -2 : 11)}
            textAnchor="middle"
          >
            {line}
          </text>
        ))}
        <title>{CONCEPT_BY_ID[n.id]?.oneLiner ?? n.name}</title>
      </Link>
    );
  };

  const arrow = (from: Placed, to: Placed, key: string) => {
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const mid = (x1 + x2) / 2;
    return (
      <path
        key={key}
        className="edge"
        markerEnd={`url(#nb-arrow-${id})`}
        d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
      />
    );
  };

  return (
    <figure className="diagram concept-neighbourhood">
      <div className="diagram-body">
        <svg
          viewBox={`${minX} 0 ${maxX - minX} ${height}`}
          width={maxX - minX}
          height={height}
          role="img"
          aria-label={`Concepts around ${concept.name}: ${requiresAll.length} required, ${leadsToAll.length} enabled, ${tensionsAll.length} in tension`}
        >
          <defs>
            <marker
              id={`nb-arrow-${id}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--line-strong)" />
            </marker>
          </defs>

          {left.map((n) => arrow(n, centre, `req-${n.id}`))}
          {right.map((n) => arrow(centre, n, `lead-${n.id}`))}

          {tensionNodes.map((n) => (
            <path
              key={`ten-${n.id}`}
              className="edge edge-danger"
              d={`M ${centre.x + NODE_W / 2} ${centre.y + NODE_H} L ${n.x + NODE_W / 2} ${n.y}`}
            />
          ))}

          {tensionNodes.length > 0 && (
            <text
              className="edge-label"
              x={centre.x + NODE_W / 2}
              y={centre.y + NODE_H + 20}
              textAnchor="middle"
            >
              trades against
            </text>
          )}

          {left.map((n) => box(n, 'plain'))}
          {right.map((n) => box(n, 'plain'))}
          {tensionNodes.map((n) => box(n, 'plain'))}
          {box(centre, 'accent')}
        </svg>
      </div>
      <figcaption className="diagram-caption">
        Arrows point from what is needed, through {concept.name}, to what it makes possible.
        Dashed lines are tensions — the pairs you cannot maximise together.
        {requiresAll.length > MAX_PER_GROUP || leadsToAll.length > MAX_PER_GROUP
          ? ' Showing the first five in each direction; the full lists are below.'
          : ''}
      </figcaption>
    </figure>
  );
}
