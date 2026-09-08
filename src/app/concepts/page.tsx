import type { Metadata } from 'next';
import Link from 'next/link';
import { CLUSTER_LABELS, CLUSTER_ORDER, conceptsByCluster, tensionIds } from '@/content/concepts';
import { CONCEPT_LEVEL } from '@/content/level-concepts';

export const metadata: Metadata = {
  title: 'Concept graph',
  description:
    'Every concept in the curriculum, with what it requires, what it makes possible, and what it trades against.',
};

export default function ConceptsPage() {
  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Concept graph</h1>
      <p className="page-lede">
        Not a glossary. Each concept records four kinds of edge: what it requires, what it leads
        to, what it stands in tension with, and the myth people believe about it. The tension
        edges are the ones that teach judgment — an architecture decision is almost always a
        choice about which side of a tension to stand on.
      </p>

      {CLUSTER_ORDER.map((cluster) => {
        const concepts = conceptsByCluster(cluster);
        if (concepts.length === 0) return null;
        return (
          <section key={cluster} style={{ marginBottom: '2.5rem' }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              {CLUSTER_LABELS[cluster]}{' '}
              <span className="faint small" style={{ fontWeight: 400 }}>
                {concepts.length}
              </span>
            </h2>
            <div className="list-rows">
              {concepts.map((c) => (
                <Link key={c.id} href={`/concepts/${c.id}`} className="list-row">
                  <div className="list-row-head">
                    <span className="list-row-title">{c.name}</span>
                    {typeof CONCEPT_LEVEL[c.id] === 'number' && (
                      <span className="tiny faint">Level {CONCEPT_LEVEL[c.id]}</span>
                    )}
                    {c.myth && <span className="chip chip-warn">myth</span>}
                    {tensionIds(c.id).length > 0 && <span className="chip">trade-off</span>}
                  </div>
                  <div className="list-row-summary">{c.oneLiner}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
