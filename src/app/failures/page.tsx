import type { Metadata } from 'next';
import Link from 'next/link';
import { loadAllFailures } from '@/lib/content-node';
import type { FailureCategory } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Failure library',
  description:
    'Production failure modes told as incidents: what you observe, why it happens, and what actually stops it.',
};

const CATEGORY_LABEL: Record<FailureCategory, string> = {
  overload: 'Overload',
  latency: 'Latency',
  data: 'Data',
  coordination: 'Coordination',
  dependency: 'Dependencies',
  deployment: 'Deployment',
  capacity: 'Capacity',
};

const ORDER: FailureCategory[] = [
  'overload',
  'latency',
  'dependency',
  'coordination',
  'data',
  'deployment',
  'capacity',
];

export default function FailuresPage() {
  const failures = loadAllFailures();

  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Failure library</h1>
      <p className="page-lede">
        These are told as incidents rather than definitions, because that is how you will meet
        them: as a symptom on a dashboard at an inconvenient hour, with no label attached. Each
        one starts from what an operator actually observes and works backwards.
      </p>

      <div className="callout callout-info">
        <p style={{ marginBottom: 0 }}>
          The pattern worth internalising: <strong>most large outages are caused by the
          system&rsquo;s response to a small failure</strong> — retries, failover, health checks,
          autoscaling — rather than by the small failure itself.
        </p>
      </div>

      {failures.length === 0 && (
        <div className="callout callout-info" style={{ marginTop: '1.5rem' }}>
          <p style={{ marginBottom: 0 }}>
            No failure walkthroughs have been written yet. They live in{' '}
            <code>content/failures/</code>.
          </p>
        </div>
      )}

      {ORDER.map((category) => {
        const inCategory = failures.filter((f) => f.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category} style={{ marginBottom: '2rem' }}>
            <h2 className="section-title" style={{ marginTop: '1.5rem' }}>
              {CATEGORY_LABEL[category]}
            </h2>
            <div className="list-rows">
              {inCategory.map((f) => (
                <Link key={f.id} href={`/failures/${f.id}`} className="list-row">
                  <div className="list-row-head">
                    <span className="list-row-title">{f.title}</span>
                  </div>
                  <div className="list-row-summary">
                    <strong>You see:</strong> {f.symptom}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
