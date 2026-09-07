# Knowledge Map & Prerequisite Graph

> Design rationale. The graph itself is data: `src/content/concepts.ts`.
> Every concept is a node; edges are typed.

## Node

```ts
Concept {
  id, name, aliases[],           // aliases drive conceptual search
  oneLiner,                      // the honest 15-word version
  cluster,                       // one of the 12 clusters below
  requires: conceptId[],         // hard prerequisites
  leadsTo: conceptId[],          // what this makes possible
  tensionWith: conceptId[],      // what it trades against
  taughtIn: lessonId[],          // where it is introduced / deepened
  appearsIn: caseStudyId[],
  patterns: patternId[],
  failureModes: failureId[]
}
```

Four edge types matter, and most teaching material only has one of them.

- `requires` — you cannot understand this without that. Drives the learning path and the
  "you're missing a prerequisite" warning.
- `leadsTo` — the consequence chain. Drives "what to learn next" and the exploration UI.
- `tensionWith` — **the one that teaches judgment.** Strong consistency ↔ availability.
  Fanout-on-write ↔ write amplification. Caching ↔ staleness. An architecture decision is
  almost always a choice about which side of a tension edge to stand on.
- `deepens` — the same concept, treated more rigorously at a higher level (§29).

## Clusters

1. **Fundamentals** — latency, throughput, availability, durability, correctness, cost.
2. **Network** — DNS, TCP, TLS, HTTP, proxies, CDN, anycast, service discovery.
3. **Application** — APIs, RPC, REST/gRPC/GraphQL, sync vs async, service boundaries.
4. **Scaling** — statelessness, horizontal scaling, load balancing, partitioning, hot keys,
   autoscaling, backpressure.
5. **Storage engines** — B-trees, LSM trees, WAL, SSTables, compaction, indexes.
6. **Transactions** — ACID, isolation levels, MVCC, locking, distributed transactions, sagas.
7. **Replication & partitioning** — leader/follower, multi-leader, leaderless, quorums,
   rebalancing, replication lag.
8. **Coordination** — clocks, logical clocks, leases, leader election, consensus, split brain.
9. **Consistency** — linearizability, serializability, causal, session guarantees, CAP/PACELC.
10. **Messaging** — queues, logs, pub/sub, delivery semantics, idempotency, DLQs, replay.
11. **Reliability** — SLI/SLO, error budgets, timeouts, retries, breakers, bulkheads,
    shedding, degradation, blast radius, DR.
12. **Operations** — deploys, migrations, observability, security, multi-tenancy, cost.

## The chains that must be walkable

These are the brief's §3 and §14 requirements, encoded as paths through the graph. The
validator asserts each of these paths exists and is acyclic.

```
request → concurrency → bottleneck → horizontal-scaling → statelessness
       → session-state → distributed-cache → cache-invalidation → staleness

single-db → read-replica → replication-lag → read-your-writes → session-consistency

sync-call → coupling → queue → delivery-semantics → duplicate-delivery
        → idempotency → idempotency-key → transactional-boundary → outbox

index → query-plan → hot-partition → partition-key-design → resharding

failure → timeout → retry → retry-amplification → backoff-jitter
        → circuit-breaker → load-shedding → graceful-degradation

no-global-clock → logical-clocks → causality → conflict-resolution
        → quorum → consensus → linearizability
```

## Why "requires" is kept honest

It is tempting to make everything require everything. The rule used here: **A requires B only
if a correct explanation of A is impossible without B.** Helpful-to-know goes in `leadsTo`
from B's side, not `requires` on A's side. Otherwise the graph degenerates into a total order
and the learner can never take a short path to something they care about.

The validator flags any concept with more than 4 `requires` edges for review.

## Search implications

The graph is what makes "database gets slow" return *indexing, query plans, connection pools,
replication, sharding, caching, hot partitions* rather than a keyword match. Symptom phrases
are first-class: `Symptom { phrase, concepts[], why }` in `src/content/symptoms.ts`. This is
the brief's §33 requirement and it is data, not magic.

## How the graph is displayed

There is no whole-graph explorer, and this is a decision rather than an omission. A force-directed
layout of nearly three hundred nodes produces a picture that is impressive and unreadable: it can
be zoomed and panned and it cannot answer a question.

What each concept page shows instead is the **local neighbourhood**, laid out deterministically:

    what this needs   ->   [ this ]   ->   what it makes possible
                              |
                        what it trades against

Three bands, no simulation, the same picture every time. The tension row is why the diagram exists
at all — `requires` and `leadsTo` are already legible as lists, but *these two pull against each
other* is a relationship a list cannot express, and it is the edge this curriculum most wants a
reader to internalise.
