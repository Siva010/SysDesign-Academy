import type { Concept } from './types';

/**
 * Search is conceptual, not lexical (brief section 33).
 *
 * A query goes through three stages:
 *   1. Symptom expansion  - "database gets slow" resolves to the concepts that explain it.
 *   2. Text retrieval     - MiniSearch over titles, summaries and bodies.
 *   3. Concept boosting   - documents tagged with the expanded concepts are lifted.
 *
 * Stage 1 is what makes the difference. Without it, "duplicate payment" returns whatever
 * document happens to contain both words, rather than idempotency and delivery semantics.
 */

export type DocKind =
  | 'lesson'
  | 'concept'
  | 'pattern'
  | 'case-study'
  | 'failure'
  | 'decision'
  | 'page';

export interface SearchDoc {
  id: string;
  kind: DocKind;
  title: string;
  summary: string;
  /** Trimmed body text; enough for retrieval, small enough to ship. */
  text: string;
  concepts: string[];
  url: string;
  /** Level index where relevant, used to show "Level 3" next to a result. */
  level?: number;
}

export interface SearchIndexPayload {
  docs: SearchDoc[];
  /** Concept id -> display name, for rendering "because you searched X" explanations. */
  conceptNames: Record<string, string>;
}

export const KIND_LABEL: Record<DocKind, string> = {
  lesson: 'Lesson',
  concept: 'Concept',
  pattern: 'Pattern',
  'case-study': 'Case study',
  failure: 'Failure',
  decision: 'Decision',
  page: 'Page',
};

/** Kind ordering for tie-breaks: teach first, reference second. */
const KIND_WEIGHT: Record<DocKind, number> = {
  lesson: 1.25,
  'case-study': 1.15,
  concept: 1.1,
  pattern: 1.1,
  failure: 1.05,
  decision: 1.05,
  page: 0.9,
};

export interface Expansion {
  /** Concepts the query maps to, whether via a symptom phrase or a concept alias. */
  concepts: string[];
  /** Human-readable reason, shown above the results. */
  reason?: string;
}

/**
 * Stage 1. Pure function so it can run on the client with the shipped symptom table.
 */
export function expandQuery(
  query: string,
  symptoms: { phrase: string; aliases: string[]; concepts: string[]; why: string }[],
  concepts: Pick<Concept, 'id' | 'name' | 'aliases'>[],
): Expansion {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return { concepts: [] };

  /* symptom phrases first: they carry an explanation */
  for (const s of symptoms) {
    const candidates = [s.phrase, ...s.aliases];
    if (candidates.some((c) => q.includes(c) || c.includes(q))) {
      return { concepts: s.concepts, reason: s.why };
    }
  }

  /* then direct concept aliases */
  const hits: string[] = [];
  for (const c of concepts) {
    const names = [c.name.toLowerCase(), ...(c.aliases ?? []).map((a) => a.toLowerCase())];
    if (names.some((n) => n === q || (q.length >= 4 && n.includes(q)))) hits.push(c.id);
  }

  return { concepts: hits.slice(0, 8) };
}

/**
 * Stage 3. Given text-search hits with scores, lift documents that carry the expanded
 * concepts. The multiplier is deliberately modest: conceptual relevance should reorder
 * results, not replace text relevance entirely.
 */
export function boostByConcepts(
  results: { id: string; score: number }[],
  docsById: Map<string, SearchDoc>,
  expanded: string[],
): { doc: SearchDoc; score: number; matchedConcepts: string[] }[] {
  const wanted = new Set(expanded);
  const out: { doc: SearchDoc; score: number; matchedConcepts: string[] }[] = [];

  for (const r of results) {
    const doc = docsById.get(r.id);
    if (!doc) continue;
    const matched = doc.concepts.filter((c) => wanted.has(c));
    const conceptBoost = matched.length === 0 ? 1 : 1 + Math.min(matched.length, 4) * 0.45;
    out.push({
      doc,
      score: r.score * conceptBoost * KIND_WEIGHT[doc.kind],
      matchedConcepts: matched,
    });
  }

  /* documents that carry the concepts but did not match the text at all still belong here */
  if (wanted.size > 0) {
    const seen = new Set(out.map((o) => o.doc.id));
    for (const doc of docsById.values()) {
      if (seen.has(doc.id)) continue;
      const matched = doc.concepts.filter((c) => wanted.has(c));
      if (matched.length === 0) continue;
      out.push({
        doc,
        score: matched.length * 1.6 * KIND_WEIGHT[doc.kind],
        matchedConcepts: matched,
      });
    }
  }

  return out.sort((a, b) => b.score - a.score);
}

/** Strip MDX component tags and markdown syntax so the index holds readable prose. */
export function plainText(mdx: string, limit = 1400): string {
  return mdx
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>|]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}
