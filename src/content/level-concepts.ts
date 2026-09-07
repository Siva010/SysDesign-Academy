import type { ConceptCluster } from '@/lib/types';
import { CONCEPTS } from './concepts';

/**
 * Which level owns each concept.
 *
 * Progress is measured against this partition: "Level 3 is 40% complete" means 40% of the
 * concepts Level 3 owns have been understood or applied. Every concept belongs to exactly
 * one level, so the percentages across levels are comparable and never double-count.
 *
 * The cluster default handles most concepts; the override map handles the ones whose
 * cluster is not where they are first taught. Caching, for example, lives in the
 * `reliability` cluster because that is where its failure modes belong, but it is taught
 * at Level 2 where the learner first needs it.
 */

const CLUSTER_LEVEL: Record<ConceptCluster, number> = {
  fundamentals: 0,
  network: 0,
  application: 1,
  scaling: 2,
  'storage-engines': 3,
  transactions: 3,
  replication: 3,
  coordination: 4,
  consistency: 4,
  messaging: 4,
  reliability: 5,
  operations: 6,
};

const OVERRIDE: Record<string, number> = {
  /* Level 1 owns the single machine and its limits */
  bottleneck: 1,
  'littles-law': 1,
  'throughput-vs-goodput': 5,
  'fanout-latency-amplification': 5,
  'tail-latency': 5,
  percentiles: 5,
  'capacity-headroom': 6,
  cost: 6,
  operability: 6,
  'operational-burden': 6,
  maintainability: 1,
  'availability-math': 5,
  /* the vocabulary of promises is foundational, but it only becomes meaningful once
     there is a system to promise something about. It is taught in Level 5. */
  availability: 5,
  durability: 5,
  reliability: 5,
  'fault-tolerance': 5,
  correctness: 5,
  scalability: 5,
  'requirement-clarification': 7,
  'back-of-envelope': 7,

  /* application concepts split between "one box" and "many boxes" */
  statelessness: 2,
  'session-state': 2,
  'sticky-sessions': 2,
  microservices: 8,
  'modular-monolith': 8,
  'service-boundary': 8,
  coupling: 8,
  'event-driven': 4,
  'api-gateway': 2,
  'sync-vs-async': 2,

  /* networking that only arrives when you scale out */
  'load-balancer': 2,
  'l4-vs-l7': 2,
  'health-check': 5,
  cdn: 2,
  anycast: 2,
  'geo-routing': 5,
  'service-discovery': 6,
  'connection-pooling': 1,
  'keep-alive': 1,

  /* caching is taught at Level 2, not with the reliability cluster */
  'cache-generic': 2,
  'cache-aside': 2,
  'write-through': 2,
  ttl: 2,
  'cache-invalidation': 2,
  eviction: 2,
  'hit-rate': 2,
  'distributed-cache': 2,
  'local-cache': 2,
  'cache-stampede': 5,
  'request-coalescing': 5,
  'cache-penetration': 5,

  /* queues appear at Level 2 as "do it later"; semantics wait for Level 4 */
  queue: 2,
  pubsub: 2,
  'queue-depth': 5,

  /* replication that is really a coordination problem */
  failover: 4,
  quorum: 4,
  'quorum-intersection': 4,
  'sloppy-quorum': 4,
  'hinted-handoff': 4,
  'read-repair': 4,
  'anti-entropy': 4,
  'conflict-resolution': 4,
  'last-write-wins': 4,
  crdt: 4,

  /* production realities */
  'connection-exhaustion': 5,
  'noisy-neighbour': 5,
  'coordinated-omission': 5,
  'hedged-request': 5,
  'thundering-herd': 5,
  'cascading-failure': 5,
  'blast-radius': 5,
  'fault-domain': 5,
  'cell-architecture': 5,
  'capacity-planning': 6,
  'cost-optimisation': 6,

  /* judgment-level concepts */
  'data-residency': 8,
  'strangler-migration': 8,
  'control-plane-vs-data-plane': 8,
};

/** Level index -> concept ids owned by that level. */
export const LEVEL_CONCEPTS: Record<number, string[]> = (() => {
  const map: Record<number, string[]> = {};
  for (let i = 0; i <= 8; i++) map[i] = [];
  for (const c of CONCEPTS) {
    const level = OVERRIDE[c.id] ?? CLUSTER_LEVEL[c.cluster];
    (map[level] ??= []).push(c.id);
  }
  return map;
})();

/** Reverse lookup: which level introduces this concept. */
export const CONCEPT_LEVEL: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const [level, ids] of Object.entries(LEVEL_CONCEPTS)) {
    for (const id of ids) map[id] = Number(level);
  }
  return map;
})();

export function conceptLevel(id: string): number | undefined {
  return CONCEPT_LEVEL[id];
}
