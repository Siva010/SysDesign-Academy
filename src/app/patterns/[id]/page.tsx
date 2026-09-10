import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { extractHeadings } from '@/components/mdx';
import { ReadingAids } from '@/components/ReadingAids';
import { ReadingContents } from '@/components/ReadingContents';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { getSource } from '@/content/sources';
import { getPattern, loadAllPatterns } from '@/lib/content-node';
import { Mdx } from '@/lib/mdx';

export function generateStaticParams() {
  return loadAllPatterns().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getPattern(id);
  if (!p) return { title: 'Pattern not found' };
  return { title: p.title, description: p.problem };
}

export default async function PatternPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pattern = getPattern(id);
  if (!pattern) notFound();

  const headings = extractHeadings(pattern.body);
  const related = pattern.relatedPatterns
    ?.map((r) => getPattern(r))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="with-rail">
      <article>
        <header className="lesson-header">
          <div className="eyebrow">Pattern · {pattern.category}</div>
          <h1 className="page-title">{pattern.title}</h1>
          <p className="page-lede" style={{ marginBottom: 0 }}>
            {pattern.problem}
          </p>
          {pattern.alsoKnownAs && pattern.alsoKnownAs.length > 0 && (
            <div className="lesson-meta">
              <span className="faint">also known as:</span>
              {pattern.alsoKnownAs.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          )}
        </header>

        <ReadingAids kind="pattern" id={pattern.id} headings={headings} />
        <ReadingContents headings={headings} />
        <div className="prose">
          <Mdx source={pattern.body} />
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

        {pattern.concepts.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Concepts</div>
            <ul className="rail-list">
              {pattern.concepts.map((c) => {
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

        {related && related.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Related patterns</div>
            <ul className="rail-list">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={`/patterns/${p.id}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pattern.seenIn && pattern.seenIn.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Publicly documented in</div>
            <ul className="rail-list">
              {pattern.seenIn.map((s) => (
                <li key={s} className="muted">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pattern.sources.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Sources</div>
            <ul className="rail-list">
              {pattern.sources.map((s) => {
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
