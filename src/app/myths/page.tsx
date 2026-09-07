import type { Metadata } from 'next';
import Link from 'next/link';
import { CLUSTER_LABELS, conceptsWithMyths } from '@/content/concepts';

export const metadata: Metadata = {
  title: 'Myths',
  description:
    'Widely repeated claims about system design that are wrong, oversimplified, or true only under conditions nobody states.',
};

export default function MythsPage() {
  const myths = conceptsWithMyths();

  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Myths</h1>
      <p className="page-lede">
        System design has an unusual amount of folklore, because most people learn it from
        summaries of summaries. These are the claims that are repeated most often and survive
        contact with production least well. Each one is attached to the concept it distorts.
      </p>

      <div className="callout callout-info">
        <p style={{ marginBottom: 0 }}>
          A myth is rarely a lie. It is usually a true statement that has lost its conditions.
          &ldquo;Cache it&rdquo; is good advice in the situation where someone first said it, and
          bad advice three situations later. The useful skill is recovering the missing condition.
        </p>
      </div>

      <div className="stack" style={{ marginTop: '2rem' }}>
        {myths.map((c) => (
          <div key={c.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <Link href={`/concepts/${c.id}`} className="eyebrow">
                {c.name}
              </Link>
              <span className="chip">{CLUSTER_LABELS[c.cluster]}</span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-lg)',
                color: 'var(--danger)',
                margin: '0 0 0.75rem',
              }}
            >
              &ldquo;{c.myth}&rdquo;
            </p>
            <p className="small" style={{ margin: 0 }}>
              {c.mythCorrection}
            </p>
          </div>
        ))}
      </div>

      <p className="small faint" style={{ marginTop: '2rem' }}>
        {myths.length} myths currently recorded, out of the concepts in the graph.
      </p>
    </div>
  );
}
