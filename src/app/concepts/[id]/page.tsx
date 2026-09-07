import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConceptMastery } from '@/components/ConceptMastery';
import { ConceptNeighbourhood } from '@/components/ConceptNeighbourhood';
import {
  CLUSTER_LABELS,
  CONCEPTS,
  CONCEPT_BY_ID,
  dependents,
  tensions,
  transitivePrerequisites,
} from '@/content/concepts';
import { DECISIONS } from '@/content/decisions';
import { CONCEPT_LEVEL } from '@/content/level-concepts';
import { SYMPTOMS } from '@/content/symptoms';
import {
  loadAllCaseStudies,
  loadAllFailures,
  loadAllPatterns,
  lessonsTeaching,
} from '@/lib/content-node';

export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = CONCEPT_BY_ID[id];
  if (!c) return { title: 'Concept not found' };
  return { title: c.name, description: c.oneLiner };
}

function ConceptList({ ids, empty }: { ids: string[]; empty?: string }) {
  const items = ids.map((id) => CONCEPT_BY_ID[id]).filter((c) => Boolean(c));
  if (items.length === 0) {
    return empty ? <p className="small faint">{empty}</p> : null;
  }
  return (
    <ul className="tight small">
      {items.map((c) => (
        <li key={c!.id}>
          <Link href={`/concepts/${c!.id}`}>{c!.name}</Link>
          <span className="muted"> — {c!.oneLiner}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concept = CONCEPT_BY_ID[id];
  if (!concept) notFound();

  const lessons = lessonsTeaching(concept.id);
  const patterns = loadAllPatterns().filter((p) => p.concepts.includes(concept.id));
  const caseStudies = loadAllCaseStudies().filter((c) => c.concepts.includes(concept.id));
  const failures = loadAllFailures().filter((f) => f.concepts.includes(concept.id));
  const decisions = DECISIONS.filter((d) => d.concepts.includes(concept.id));
  const symptoms = SYMPTOMS.filter((s) => s.concepts.includes(concept.id));
  const needs = transitivePrerequisites(concept.id);
  const enables = dependents(concept.id);
  const trades = tensions(concept.id);
  const level = CONCEPT_LEVEL[concept.id];

  return (
    <div className="with-rail">
      <article>
        <header className="lesson-header">
          <div className="eyebrow">
            {CLUSTER_LABELS[concept.cluster]}
            {typeof level === 'number' && (
              <>
                {' · '}
                <Link href={`/levels/${level}`}>Level {level}</Link>
              </>
            )}
          </div>
          <h1 className="page-title">{concept.name}</h1>
          <p className="page-lede" style={{ marginBottom: 0 }}>
            {concept.oneLiner}
          </p>
          {concept.aliases && concept.aliases.length > 0 && (
            <div className="lesson-meta">
              <span className="faint">also called:</span>
              {concept.aliases.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          )}
        </header>

        <ConceptMastery conceptId={concept.id} />

        {concept.myth && concept.mythCorrection && (
          <div className="callout callout-danger">
            <div className="callout-title">The myth</div>
            <p style={{ fontStyle: 'italic' }}>&ldquo;{concept.myth}&rdquo;</p>
            <p style={{ marginBottom: 0 }}>
              <strong>What is actually true:</strong> {concept.mythCorrection}
            </p>
          </div>
        )}

        {trades.length > 0 && (
          <section>
            <h2 className="section-title" style={{ marginTop: '2rem' }}>
              What it trades against
            </h2>
            <p className="small muted">
              These are the tensions this concept participates in. Choosing this concept means
              accepting less of these.
            </p>
            <div className="stack">
              {trades.map((t) => (
                <div key={t.id} className="card">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>
                      <Link href={`/concepts/${t.id}`}>{t.name}</Link>
                    </strong>
                    <span className="chip">{CLUSTER_LABELS[t.cluster]}</span>
                  </div>
                  <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
                    {t.oneLiner}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="section-title">Where it sits in the graph</h2>

          <ConceptNeighbourhood id={concept.id} />

          <div className="card-grid">
            <div className="card">
              <div className="eyebrow">Requires</div>
              <ConceptList
                ids={concept.requires ?? []}
                empty="Nothing. This is an entry point into its cluster."
              />
            </div>
            <div className="card">
              <div className="eyebrow">Leads to</div>
              <ConceptList
                ids={concept.leadsTo ?? []}
                empty="Nothing yet recorded."
              />
            </div>
          </div>

          {needs.length > 0 && (
            <details style={{ marginTop: '1rem' }}>
              <summary>
                Full prerequisite chain ({needs.length} concept{needs.length === 1 ? '' : 's'})
              </summary>
              <div className="details-body">
                <p className="small muted">
                  Everything this concept depends on, transitively, deepest first. If a
                  explanation of {concept.name} ever feels arbitrary, the gap is usually
                  somewhere in this list.
                </p>
                <ConceptList ids={needs} />
              </div>
            </details>
          )}

          {enables.length > 0 && (
            <details>
              <summary>Concepts that depend on this one ({enables.length})</summary>
              <div className="details-body">
                <ConceptList ids={enables.map((e) => e.id)} />
              </div>
            </details>
          )}
        </section>

        {symptoms.length > 0 && (
          <section>
            <h2 className="section-title">When you would reach for this</h2>
            <p className="small muted">
              Real situations that lead here. These phrases are indexed by search.
            </p>
            <div className="stack">
              {symptoms.map((s) => (
                <div key={s.phrase} className="card">
                  <strong>&ldquo;{s.phrase}&rdquo;</strong>
                  <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
                    {s.why}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      <aside className="rail">
        {lessons.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Taught in</div>
            <ul className="rail-list">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link href={`/lessons/${l.id}`}>{l.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {patterns.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Patterns</div>
            <ul className="rail-list">
              {patterns.map((p) => (
                <li key={p.id}>
                  <Link href={`/patterns/${p.id}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {caseStudies.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Appears in</div>
            <ul className="rail-list">
              {caseStudies.map((c) => (
                <li key={c.id}>
                  <Link href={`/case-studies/${c.id}`}>{c.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {failures.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">How it fails</div>
            <ul className="rail-list">
              {failures.map((f) => (
                <li key={f.id}>
                  <Link href={`/failures/${f.id}`}>{f.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {decisions.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Decisions involving this</div>
            <ul className="rail-list">
              {decisions.map((d) => (
                <li key={d.id}>
                  <Link href={`/decisions/${d.id}`}>{d.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
