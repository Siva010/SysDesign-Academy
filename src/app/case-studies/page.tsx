import type { Metadata } from 'next';
import Link from 'next/link';
import { SIGNATURE_LABEL, SIGNATURE_ORDER } from '@/content/signatures';
import { loadAllCaseStudies } from '@/lib/content-node';

export const metadata: Metadata = {
  title: 'Case studies',
  description:
    'Full design derivations with escalating interviewer pressure, indexed by the primitive problem underneath.',
};

export default function CaseStudiesPage() {
  const studies = loadAllCaseStudies();

  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Case studies</h1>
      <p className="page-lede">
        Each of these is a derivation you can replay, not an architecture to memorise. They are
        indexed by the <strong>primitive problem</strong> underneath, because that is what
        transfers. &ldquo;Design a ride-hailing service&rdquo; and &ldquo;design a food delivery
        service&rdquo; are the same geospatial-index problem with different nouns.
      </p>

      <div className="callout callout-warn">
        <div className="callout-title">A standing caveat</div>
        <p style={{ marginBottom: 0 }}>
          Every case study here is a <strong>pedagogical approximation</strong>, not a claim
          about any company&rsquo;s proprietary architecture. Where something is publicly
          documented it is cited and labelled; everything else is presented as reasonable
          engineering design, which is a different thing from fact.
        </p>
      </div>

      {studies.length === 0 && (
        <div className="callout callout-info" style={{ marginTop: '1.5rem' }}>
          <p style={{ marginBottom: 0 }}>
            No case studies have been written yet. They live in{' '}
            <code>content/case-studies/</code>.
          </p>
        </div>
      )}

      {studies.length > 0 && (
        <section>
          <h2 className="section-title">All case studies</h2>
          <div className="list-rows">
            {studies.map((c) => (
              <Link key={c.id} href={`/case-studies/${c.id}`} className="list-row">
                <div className="list-row-head">
                  <span className="list-row-title">{c.title}</span>
                  <span className="chip">{c.difficulty}</span>
                  <span className="tiny faint">{c.minutes} min</span>
                </div>
                <div className="list-row-summary">{c.ask}</div>
                <div className="chip-row" style={{ marginTop: '0.4rem' }}>
                  {c.signatures.map((s) => (
                    <span key={s} className="chip chip-accent">
                      {SIGNATURE_LABEL[s]}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">By primitive problem</h2>
        <p className="muted small" style={{ maxWidth: '44rem' }}>
          When you meet an unfamiliar prompt, the useful question is not &ldquo;which company
          does this look like?&rdquo; but &ldquo;which of these problems am I actually
          solving?&rdquo;
        </p>
        <div className="card-grid" style={{ marginTop: '1rem' }}>
          {SIGNATURE_ORDER.map((sig) => {
            const matching = studies.filter((c) => c.signatures.includes(sig));
            return (
              <div key={sig} className="card">
                <strong>{SIGNATURE_LABEL[sig]}</strong>
                <p className="tiny faint mono" style={{ margin: '0.2rem 0 0.5rem' }}>
                  {sig}
                </p>
                {matching.length === 0 ? (
                  <p className="small faint" style={{ margin: 0 }}>
                    No case study covers this yet.
                  </p>
                ) : (
                  <ul className="tight small">
                    {matching.map((c) => (
                      <li key={c.id}>
                        <Link href={`/case-studies/${c.id}`}>{c.title}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
