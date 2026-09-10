import type { Metadata } from 'next';
import { SOURCES } from '@/content/sources';
import type { SourceTier } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Sources and evidence',
  description:
    'The source hierarchy this curriculum is built from, and the rules governing what may be claimed as fact.',
};

const TIER_TITLE: Record<SourceTier, string> = {
  1: 'Tier 1 — Technical authority',
  2: 'Tier 2 — Foundational learning',
  3: 'Tier 3 — Production reality',
  4: 'Tier 4 — Interview convention',
};

const TIER_DESC: Record<SourceTier, string> = {
  1: 'RFCs, original papers, and official documentation. These establish what a protocol does, what a database guarantees, and what an algorithm proves. A factual claim in this curriculum must be supported here or at tier 2.',
  2: 'Textbooks and university courses. These establish conceptual truth and framing, and are where most of the reasoning structure comes from.',
  3: 'Engineering blogs. These establish what one company did, at one point in time, under constraints they may not have described. Useful and specific; never generalisable on their own.',
  4: 'Interview preparation material. This establishes what interviews conventionally expect and how answers are conventionally communicated. It is never used as support for a technical fact.',
};

const CLAIM_RULES = [
  {
    label: 'Fact',
    tone: 'chip chip-ok',
    meaning: 'Documented and verifiable.',
    requires: 'A tier 1 or tier 2 citation. Enforced by the content validator.',
  },
  {
    label: 'Convention',
    tone: 'chip',
    meaning: 'What the industry commonly does.',
    requires: 'Two independent sources, or one engineering-blog account describing real practice.',
  },
  {
    label: 'Recommendation',
    tone: 'chip chip-accent',
    meaning: 'Our engineering opinion.',
    requires: 'Stated reasoning and stated conditions. An opinion without conditions is not useful.',
  },
  {
    label: 'Simplification',
    tone: 'chip chip-warn',
    meaning: 'True enough at this level of the curriculum.',
    requires: 'A link to the deeper treatment that corrects it later.',
  },
  {
    label: 'Inference',
    tone: 'chip chip-warn',
    meaning: 'Derived by us, not stated by the source.',
    requires: 'The derivation shown, so you can disagree with it.',
  },
  {
    label: 'Speculation',
    tone: 'chip chip-danger',
    meaning: 'Plausible and unverified.',
    requires:
      'Permitted only for pedagogical architectures. Never attached to a claim about a real company.',
  },
];

export default function SourcesPage() {
  const tiers: SourceTier[] = [1, 2, 3, 4];

  return (
    <div className="content-wide">
      <p className="eyebrow">About</p>
      <h1 className="page-title">Sources and evidence</h1>
      <p className="page-lede">
        A curriculum that cannot say where a claim came from is a curriculum you have to take on
        faith. This page states the hierarchy, the rules, and every source in the registry.
      </p>

      <section>
        <h2 className="section-title">How claims are labelled</h2>
        <p className="muted small">
          Every non-obvious statement in a lesson carries one of six labels. The point is that you
          can always see how much weight a sentence is able to bear.
        </p>
        <div className="table-scroll" style={{ marginTop: '1rem' }}>
          <table className="block-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Means</th>
                <th>Requires</th>
              </tr>
            </thead>
            <tbody>
              {CLAIM_RULES.map((r) => (
                <tr key={r.label}>
                  <td>
                    <span className={r.tone}>{r.label}</span>
                  </td>
                  <td>{r.meaning}</td>
                  <td className="muted">{r.requires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="section-title">Rules we hold ourselves to</h2>
        <div className="stack">
          <div className="card">
            <strong>The hierarchy is never inverted.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              An interview-preparation site may not be the sole support for a claim about protocol
              behaviour, database guarantees, or consistency semantics. It is authoritative about
              interviews and nothing else.
            </p>
          </div>
          <div className="card">
            <strong>No invented benchmarks.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              Numbers are cited measurements with a date, physical constants, or stated
              assumptions you can change. A confident-sounding figure with no provenance is worse
              than an order of magnitude with an honest one.
            </p>
          </div>
          <div className="card">
            <strong>No invented company architectures.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              Case studies are pedagogical approximations and say so on every page. Where a design
              detail is publicly documented, it is cited. Where it is not, it is presented as
              reasonable engineering design, which is a different claim.
            </p>
          </div>
          <div className="card">
            <strong>Disagreement is shown, not resolved silently.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              When sources conflict, the content states what each says, why they differ — usually
              version, workload, or definition — and what you should take from it.
            </p>
          </div>
          <div className="card">
            <strong>Sources are scoped.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              Each entry below records what it is authoritative <em>for</em>. Citing a source
              outside that scope is a review failure, not a stylistic preference.
            </p>
          </div>
        </div>
      </section>

      {tiers.map((tier) => {
        const inTier = SOURCES.filter((s) => s.tier === tier);
        return (
          <section key={tier}>
            <h2 className="section-title">{TIER_TITLE[tier]}</h2>
            <p className="muted small">
              {TIER_DESC[tier]}
            </p>
            <div className="list-rows" style={{ marginTop: '1rem' }}>
              {inTier.map((s) => (
                <div key={s.id} className="list-row">
                  <div className="list-row-head">
                    <span className="list-row-title">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer noopener">
                          {s.title}
                        </a>
                      ) : (
                        s.title
                      )}
                    </span>
                    {s.author && <span className="tiny faint">{s.author}</span>}
                    {s.year && <span className="tiny faint tnum">{s.year}</span>}
                    <span className="chip">{s.kind.replace('-', ' ')}</span>
                  </div>
                  <div className="list-row-summary">
                    <span className="faint">Authoritative for: </span>
                    {s.authoritativeFor.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
