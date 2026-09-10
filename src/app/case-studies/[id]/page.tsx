import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { extractHeadings } from '@/components/mdx';
import { ReadingAids } from '@/components/ReadingAids';
import { ReadingContents } from '@/components/ReadingContents';
import { CaseStudyFooter } from '@/components/CaseStudyFooter';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { SIGNATURE_LABEL } from '@/content/signatures';
import { getSource } from '@/content/sources';
import { getCaseStudy, getPattern, loadAllCaseStudies } from '@/lib/content-node';
import { Mdx } from '@/lib/mdx';


export function generateStaticParams() {
  return loadAllCaseStudies().map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = getCaseStudy(id);
  if (!c) return { title: 'Case study not found' };
  return { title: c.title, description: c.ask };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const study = getCaseStudy(id);
  if (!study) notFound();

  const headings = extractHeadings(study.body);

  return (
    <div className="with-rail">
      <article>
        <header className="lesson-header">
          <div className="eyebrow">Case study</div>
          <h1 className="page-title">{study.title}</h1>
          <p className="page-lede" style={{ marginBottom: 0 }}>
            <strong>The ask:</strong> &ldquo;{study.ask}&rdquo;
          </p>
          <div className="lesson-meta">
            <span className="chip">{study.difficulty}</span>
            <span>{study.minutes} min</span>
          </div>
          <div className="chip-row" style={{ marginTop: '0.75rem' }}>
            {study.signatures.map((s) => (
              <span key={s} className="chip chip-accent">
                {SIGNATURE_LABEL[s]}
              </span>
            ))}
          </div>
        </header>

        <div className="callout callout-warn">
          <div className="callout-title">Pedagogical approximation</div>
          <p style={{ marginBottom: 0 }}>
            This is a design derived from stated requirements. It is not a claim about how any
            particular company builds this. Publicly documented facts are cited and labelled;
            everything else is reasonable engineering design, and is marked as such.
          </p>
        </div>

        <ReadingAids kind="case-study" id={study.id} headings={headings} />
        <ReadingContents headings={headings} />
        <div className="prose">
          <Mdx source={study.body} />
        </div>

        <CaseStudyFooter id={study.id} />
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

        {study.patterns.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Patterns used</div>
            <ul className="rail-list">
              {study.patterns.map((p) => {
                const pattern = getPattern(p);
                return (
                  <li key={p}>
                    {pattern ? (
                      <Link href={`/patterns/${p}`}>{pattern.title}</Link>
                    ) : (
                      <span className="muted">{p}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {study.concepts.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Concepts exercised</div>
            <ul className="rail-list">
              {study.concepts.map((c) => {
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

        {study.sources.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Sources</div>
            <ul className="rail-list">
              {study.sources.map((s) => {
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
