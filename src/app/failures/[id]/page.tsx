import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { extractHeadings } from '@/components/mdx';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { getSource } from '@/content/sources';
import { getFailure, loadAllFailures } from '@/lib/content-node';
import { Mdx } from '@/lib/mdx';

export function generateStaticParams() {
  return loadAllFailures().map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const f = getFailure(id);
  if (!f) return { title: 'Failure not found' };
  return { title: f.title, description: f.symptom };
}

export default async function FailurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const failure = getFailure(id);
  if (!failure) notFound();

  const headings = extractHeadings(failure.body);

  return (
    <div className="with-rail">
      <article>
        <header className="lesson-header">
          <div className="eyebrow">Failure mode · {failure.category}</div>
          <h1 className="page-title">{failure.title}</h1>
          <p className="page-lede" style={{ marginBottom: 0 }}>
            <strong>What you observe:</strong> {failure.symptom}
          </p>
        </header>

        <div className="prose">
          <Mdx source={failure.body} />
        </div>
      </article>

      <aside className="rail">
        {headings.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">On this page</div>
            <ul className="rail-list">
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className={h.level === 3 ? 'indent' : undefined}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {failure.concepts.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Concepts involved</div>
            <ul className="rail-list">
              {failure.concepts.map((c) => {
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
        )}

        {failure.sources.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Sources</div>
            <ul className="rail-list">
              {failure.sources.map((s) => {
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
        )}
      </aside>
    </div>
  );
}
