import type { Metadata } from 'next';
import Link from 'next/link';
import { CONCEPTS } from '@/content/concepts';
import { CONCEPT_LEVEL } from '@/content/level-concepts';

export const metadata: Metadata = {
  title: 'Glossary',
  description: 'Every term in the curriculum, defined in one honest sentence, linked to where it is taught.',
};

export default function GlossaryPage() {
  const sorted = [...CONCEPTS].sort((a, b) => a.name.localeCompare(b.name));
  const groups = new Map<string, typeof sorted>();
  for (const c of sorted) {
    const letter = /^[a-z]/i.test(c.name) ? c.name[0]!.toUpperCase() : '#';
    const list = groups.get(letter) ?? [];
    list.push(c);
    groups.set(letter, list);
  }
  const letters = [...groups.keys()];

  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Glossary</h1>
      <p className="page-lede">
        One honest sentence per term. This exists for reinforcement and navigation, not for
        learning: a definition tells you what something is called, and this curriculum is about
        knowing when to reach for it. Follow the link for the trade-offs.
      </p>

      <nav className="chip-row" aria-label="Jump to letter" style={{ marginBottom: '2rem' }}>
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="chip">
            {l}
          </a>
        ))}
      </nav>

      {letters.map((letter) => (
        <section key={letter} id={`letter-${letter}`} style={{ marginBottom: '2rem' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            {letter}
          </h2>
          <dl className="glossary">
            {groups.get(letter)!.map((c) => (
              <div key={c.id}>
                <dt>
                  <Link href={`/concepts/${c.id}`}>{c.name}</Link>
                  {typeof CONCEPT_LEVEL[c.id] === 'number' && (
                    <span className="tiny faint"> · Level {CONCEPT_LEVEL[c.id]}</span>
                  )}
                </dt>
                <dd>
                  {c.oneLiner}
                  {c.aliases && c.aliases.length > 0 && (
                    <span className="tiny faint"> Also: {c.aliases.join(', ')}.</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
