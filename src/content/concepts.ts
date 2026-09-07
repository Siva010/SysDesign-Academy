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

/** Concepts that list `id` in their own `requires`. */
export function dependents(id: string): Concept[] {
  return CONCEPTS.filter((c) => c.requires?.includes(id));
}

/** Concepts that point at `id` via leadsTo. */
export function precedents(id: string): Concept[] {
  return CONCEPTS.filter((c) => c.leadsTo?.includes(id));
}

/**
 * Tension edges are conceptually undirected but stored on one side only.
 * This returns both directions so a concept page shows every trade-off it participates in.
 */
export function tensions(id: string): Concept[] {
  const own = CONCEPT_BY_ID[id]?.tensionWith ?? [];
  const reverse = CONCEPTS.filter((c) => c.tensionWith?.includes(id)).map((c) => c.id);
  const ids = Array.from(new Set([...own, ...reverse])).filter((x) => x !== id);
  return ids.map((x) => CONCEPT_BY_ID[x]).filter((c): c is Concept => Boolean(c));
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
        ...(c.tensionWith ?? []),
        ...dependents(cur).map((x) => x.id),
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
