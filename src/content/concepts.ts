import type { Concept, ConceptCluster } from '@/lib/types';
import { CORE_CONCEPTS } from './concepts/core';
import { DATA_CONCEPTS } from './concepts/data';
import { DISTRIBUTED_CONCEPTS } from './concepts/distributed';
import { PRODUCTION_CONCEPTS } from './concepts/production';

export const CONCEPTS: Concept[] = [
  ...CORE_CONCEPTS,
  ...DATA_CONCEPTS,
  ...DISTRIBUTED_CONCEPTS,
  ...PRODUCTION_CONCEPTS,
];

export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
);

export function getConcept(id: string): Concept | undefined {
  return CONCEPT_BY_ID[id];
}

export const CLUSTER_LABELS: Record<ConceptCluster, string> = {
  fundamentals: 'Fundamentals',
  network: 'Networking',
  application: 'Application architecture',
  scaling: 'Scaling',
  'storage-engines': 'Storage engines',
  transactions: 'Transactions',
  replication: 'Replication',
  coordination: 'Coordination',
  consistency: 'Consistency',
  messaging: 'Messaging',
  reliability: 'Reliability',
  operations: 'Operations',
};

export const CLUSTER_ORDER: ConceptCluster[] = [
  'fundamentals',
  'network',
  'application',
  'scaling',
  'storage-engines',
  'transactions',
  'replication',
  'coordination',
  'consistency',
  'messaging',
  'reliability',
  'operations',
];

/* ------------------------------------------------------------------ graph queries */

/**
 * Reverse adjacency, built once at module load.
 *
 * Two of the three edge kinds are only ever written from one side. `requires` is directed and
 * its inverse has no name in the data; `tensionWith` is genuinely undirected but declaring it
 * twice would mean two places to keep in agreement, so it is declared from whichever side reads
 * more naturally. Both facts used to be handled by scanning all 297 concepts inside the
 * accessor, which meant every caller that forgot to use the accessor silently saw half the
 * graph - and the neighbourhood diagram did exactly that, disagreeing with the list printed
 * underneath it on the same page.
 *
 * Materialising the reverse direction once removes both problems: the scans happen a fixed
 * three times instead of once per call, and there is no longer a raw field worth reading.
 */
function reverseIndex(pick: (c: Concept) => string[] | undefined): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of CONCEPTS) {
    for (const target of pick(c) ?? []) {
      (out[target] ??= []).push(c.id);
    }
  }
  return out;
}

const DEPENDENTS = reverseIndex((c) => c.requires);
const PRECEDENTS = reverseIndex((c) => c.leadsTo);

/** Undirected, so each concept's entry is the union of the edges it declares and those declared at it. */
const TENSIONS: Record<string, string[]> = (() => {
  const reverse = reverseIndex((c) => c.tensionWith);
  const out: Record<string, string[]> = {};
  for (const c of CONCEPTS) {
    const both = new Set([...(c.tensionWith ?? []), ...(reverse[c.id] ?? [])]);
    both.delete(c.id);
    out[c.id] = [...both];
  }
  return out;
})();

const lookup = (ids: string[] | undefined): Concept[] =>
  (ids ?? []).map((x) => CONCEPT_BY_ID[x]).filter((c): c is Concept => Boolean(c));

/** Concepts that list `id` in their own `requires`. */
export function dependents(id: string): Concept[] {
  return lookup(DEPENDENTS[id]);
}

/** Concepts that point at `id` via leadsTo. */
export function precedents(id: string): Concept[] {
  return lookup(PRECEDENTS[id]);
}

/**
 * Every trade-off `id` participates in, in both directions. Prefer this over reading
 * `tensionWith`, which is only ever half the answer.
 */
export function tensions(id: string): Concept[] {
  return lookup(TENSIONS[id]);
}

/** The same set as ids, for callers that only need to count or lay out. */
export function tensionIds(id: string): string[] {
  return TENSIONS[id] ?? [];
}

/**
 * Full transitive prerequisite set, deepest first.
 * Cycle-safe: a concept already on the stack is skipped rather than recursed into.
 */
export function transitivePrerequisites(id: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const walk = (cur: string, stack: Set<string>) => {
    const concept = CONCEPT_BY_ID[cur];
    if (!concept) return;
    for (const req of concept.requires ?? []) {
      if (stack.has(req)) continue;
      stack.add(req);
      walk(req, stack);
      stack.delete(req);
      if (!seen.has(req)) {
        seen.add(req);
        out.push(req);
      }
    }
  };

  walk(id, new Set([id]));
  return out;
}

/**
 * Shortest prerequisite-respecting path from something the learner knows to a target.
 * Used by the "what to learn next" recommender.
 */
export function pathTo(target: string, known: Set<string>): string[] {
  const need = transitivePrerequisites(target).filter((c) => !known.has(c));
  return [...need, target];
}

/** Concepts within `depth` hops of `id`, following requires/leadsTo/tension edges. */
export function neighbourhood(id: string, depth = 1): Concept[] {
  let frontier = new Set<string>([id]);
  const seen = new Set<string>([id]);

  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const cur of frontier) {
      const c = CONCEPT_BY_ID[cur];
      if (!c) continue;
      const adjacent = [
        ...(c.requires ?? []),
        ...(c.leadsTo ?? []),
        ...tensionIds(cur),
        ...(DEPENDENTS[cur] ?? []),
      ];
      for (const a of adjacent) {
        if (!seen.has(a)) {
          seen.add(a);
          next.add(a);
        }
      }
    }
    frontier = next;
  }

  seen.delete(id);
  return Array.from(seen)
    .map((x) => CONCEPT_BY_ID[x])
    .filter((c): c is Concept => Boolean(c));
}

/** Every concept that carries a myth. Powers the "myths" surface (brief section 12). */
export function conceptsWithMyths(): Concept[] {
  return CONCEPTS.filter((c) => Boolean(c.myth && c.mythCorrection));
}

export function conceptsByCluster(cluster: ConceptCluster): Concept[] {
  return CONCEPTS.filter((c) => c.cluster === cluster);
}
