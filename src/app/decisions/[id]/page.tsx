import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DecisionTable } from '@/components/DecisionTable';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { DECISIONS, DECISION_BY_ID } from '@/content/decisions';
import { getSource } from '@/content/sources';

export function generateStaticParams() {
  return DECISIONS.map((d) => ({ id: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = DECISION_BY_ID[id];
  if (!d) return { title: 'Decision not found' };
  return { title: d.title, description: d.question };
}

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decision = DECISION_BY_ID[id];
  if (!decision) notFound();

  return (
    <div className="with-rail">
      <article>
        <header className="lesson-header">
          <div className="eyebrow">Decision</div>
          <h1 className="page-title">{decision.title}</h1>
          <p className="page-lede" style={{ marginBottom: 0 }}>
            {decision.question}
          </p>
        </header>

        <DecisionTable decision={decision} />
      </article>

      <aside className="rail">
        <div className="rail-section">
          <div className="rail-heading">Concepts</div>
          <ul className="rail-list">
            {decision.concepts.map((c) => {
              const concept = CONCEPT_BY_ID[c];
              if (!concept) return null;
              return (
                <li key={c}>
                  <Link href={`/concepts/${c}`}>{concept.name}</Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rail-section">
          <div className="rail-heading">Sources</div>
          <ul className="rail-list">
            {decision.sources.map((s) => {
              const source = getSource(s);
              if (!source) return null;
              return (
                <li key={s}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer noopener">
                      {source.title}
                    </a>
                  ) : (
                    <span className="muted">{source.title}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rail-section">
          <div className="rail-heading">Other decisions</div>
          <ul className="rail-list">
            {DECISIONS.filter((d) => d.id !== decision.id)
              .slice(0, 8)
              .map((d) => (
                <li key={d.id}>
                  <Link href={`/decisions/${d.id}`}>{d.title}</Link>
                </li>
              ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
