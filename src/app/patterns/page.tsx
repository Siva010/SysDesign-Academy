import type { Metadata } from 'next';
import Link from 'next/link';
import { loadAllPatterns } from '@/lib/content-node';
import type { PatternCategory } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Pattern library',
  description:
    'Reusable architectural patterns, each with the section most libraries omit: when not to use it.',
};

const CATEGORY_LABEL: Record<PatternCategory, string> = {
  caching: 'Caching',
  data: 'Data',
  messaging: 'Messaging',
  resilience: 'Resilience',
  scaling: 'Scaling',
  deployment: 'Deployment',
  consistency: 'Consistency',
};

const ORDER: PatternCategory[] = [
  'caching',
  'data',
  'consistency',
  'messaging',
  'scaling',
  'resilience',
  'deployment',
];

export default function PatternsPage() {
  const patterns = loadAllPatterns();

  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Pattern library</h1>
      <p className="page-lede">
        A pattern is a named answer to a recurring problem. That makes it useful and dangerous
        in equal measure: naming something makes it easy to reach for when it does not apply.
        Every entry here states the problem first and ends with the conditions under which it
        is the wrong choice.
      </p>

      {patterns.length === 0 && (
        <div className="callout callout-info">
          <p style={{ marginBottom: 0 }}>
            No patterns have been written yet. They live in <code>content/patterns/</code>.
          </p>
        </div>
      )}

      {ORDER.map((category) => {
        const inCategory = patterns.filter((p) => p.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category} style={{ marginBottom: '2rem' }}>
            <h2 className="section-title" style={{ marginTop: '1.5rem' }}>
              {CATEGORY_LABEL[category]}
            </h2>
            <div className="list-rows">
              {inCategory.map((p) => (
                <Link key={p.id} href={`/patterns/${p.id}`} className="list-row">
                  <div className="list-row-head">
                    <span className="list-row-title">{p.title}</span>
                    {p.alsoKnownAs?.map((a) => (
                      <span key={a} className="chip">
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="list-row-summary">{p.problem}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
