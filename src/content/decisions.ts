import type { Decision } from '@/lib/types';

/**
 * Decision tables (brief section 31).
 *
 * These are deliberately NOT "pros and cons" lists. A pros/cons list lets you pick the
 * column with more bullet points. The `rules` array is the important part: it reads
 * constraint -> consequence -> choice, which is how the decision is actually made.
 */
export const DECISIONS: Decision[] = [
  {
    id: 'sql-vs-nosql',
    title: 'Relational vs non-relational store',
    question: 'I need to store the primary data for a new service. What do I choose?',
    options: [
      {
        id: 'relational',
        name: 'Relational (PostgreSQL, MySQL)',
        oneLiner: 'Schema, joins, multi-row transactions, mature tooling.',
      },
      {
        id: 'document',
        name: 'Document (MongoDB, DynamoDB)',
        oneLiner: 'Flexible shape, access-pattern-first modelling, easy horizontal partitioning.',
      },
      {
        id: 'wide-column',
        name: 'Wide-column (Cassandra, Bigtable)',
        oneLiner: 'Enormous write throughput, partition-key-driven queries, tunable consistency.',
      },
    ],
    criteria: [
      {
        criterion: 'Queries you have not thought of yet',
        values: {
          relational: 'Ad-hoc joins and filters work without redesigning storage',
          document: 'Possible but often a full scan or a secondary index you must plan',
          'wide-column': 'Effectively unsupported: the partition key defines what is answerable',
        },
        favours: 'relational',
      },
      {
        criterion: 'Multi-row atomic updates',
        values: {
          relational: 'Native, mature, well understood',
          document: 'Often available, usually limited in scope and cost',
          'wide-column': 'Single-partition at best; cross-partition is a design smell',
        },
        favours: 'relational',
      },
      {
        criterion: 'Write throughput ceiling on one node',
        values: {
          relational: 'High, but bounded by a single leader',
          document: 'Higher: partitioning is built in from day one',
          'wide-column': 'Highest: designed for continuous append at scale',
        },
        favours: 'wide-column',
      },
      {
        criterion: 'Cost of getting the model wrong',
        values: {
          relational: 'Low: add an index, alter a table, write a different query',
          document: 'Moderate: fixing an access pattern usually means a migration',
          'wide-column': 'High: the wrong partition key means rewriting the dataset',
        },
        favours: 'relational',
      },
      {
        criterion: 'Operational familiarity',
        values: {
          relational: 'Nearly universal; every team has someone who has run one',
          document: 'Common, often managed',
          'wide-column': 'Specialist: compaction, repair and tuning are real jobs',
        },
        favours: 'relational',
      },
    ],
    rules: [
      {
        constraint: 'You cannot yet enumerate every query the product will need',
        consequence: 'Storage optimised for known access patterns will block a feature later',
        choose: 'relational',
      },
      {
        constraint: 'Correctness depends on updating several records atomically',
        consequence: 'Anything else forces you to build sagas and compensations by hand',
        choose: 'relational',
      },
      {
        constraint: 'Sustained write rate exceeds what one leader can absorb, measured not guessed',
        consequence: 'A single-leader design cannot be scaled by adding replicas',
        choose: 'wide-column',
      },
      {
        constraint: 'Every query is a lookup by one known key, and the dataset is huge',
        consequence: 'Joins and ad-hoc queries are not required, so you can trade them away',
        choose: 'document',
      },
    ],
    antiPattern:
      '"SQL does not scale, so we chose NoSQL." A single well-indexed relational node handles tens of thousands of transactions per second and terabytes of data. Most teams that switched for scale had an indexing problem, and paid for it with lost joins and hand-written transactions.',
    concepts: ['acid', 'sharding', 'partition-key', 'index', 'denormalisation', 'vertical-scaling'],
    sources: ['ddia', 'postgres-docs', 'cassandra-docs', 'dynamo'],
  },

  {
    id: 'strong-vs-eventual',
    title: 'Strong vs eventual consistency',
    question: 'How fresh must this read be, and what am I willing to pay for it?',
    options: [
      {
        id: 'strong',
        name: 'Linearizable reads',
        oneLiner: 'Always the latest committed value, at the cost of coordination.',
      },
      {
        id: 'session',
        name: 'Session guarantees',
        oneLiner: 'Each user sees a coherent story, others may lag.',
      },
      {
        id: 'eventual',
        name: 'Eventual consistency',
        oneLiner: 'Fast and available; replicas converge afterwards.',
      },
    ],
    criteria: [
      {
        criterion: 'Read latency',
        values: {
          strong: 'Includes a quorum round trip, or a hop to the leader',
          session: 'Local read, with routing or version tracking',
          eventual: 'Nearest replica, no coordination',
        },
        favours: 'eventual',
      },
      {
        criterion: 'Behaviour during a network partition',
        values: {
          strong: 'The minority side stops serving',
          session: 'Serves, possibly stale',
          eventual: 'Serves everywhere',
        },
        favours: 'eventual',
      },
      {
        criterion: 'Cost of a stale answer',
        values: {
          strong: 'Chosen when a stale answer is incorrect: balances, inventory, permissions',
          session: 'Chosen when a stale answer is confusing but harmless',
          eventual: 'Chosen when a stale answer is invisible: counts, feeds, search',
        },
        favours: 'strong',
      },
      {
        criterion: 'Implementation cost',
        values: {
          strong: 'Consensus, leader placement, failover behaviour to design',
          session: 'Routing or version tokens per user',
          eventual: 'Conflict resolution and staleness monitoring',
        },
        favours: 'session',
      },
    ],
    rules: [
      {
        constraint: 'A stale read can cause an irreversible wrong action (double spend, oversell)',
        consequence: 'Availability during a partition is worth less than correctness',
        choose: 'strong',
      },
      {
        constraint: 'Users are confused by not seeing their own writes, but other users lagging is fine',
        consequence: 'You need per-user coherence, not global coherence',
        choose: 'session',
      },
      {
        constraint: 'The data is a count, a feed, a recommendation or a search result',
        consequence: 'A slightly stale answer is more valuable to the user than a slow or absent one',
        choose: 'eventual',
      },
    ],
    antiPattern:
      '"Eventual consistency means the data might be wrong." It means readers may briefly lag. The failure mode of strong consistency is worse for most features: an outage instead of a slightly old number.',
    concepts: [
      'linearizability',
      'eventual-consistency',
      'session-guarantees',
      'cap',
      'pacelc',
      'staleness',
    ],
    sources: ['ddia', 'gilbert-lynch', 'abadi-pacelc', 'spanner'],
  },

  {
    id: 'queue-vs-log',
    title: 'Task queue vs durable log',
    question: 'I need to move work off the request path. Which shape of broker?',
    options: [
      {
        id: 'task-queue',
        name: 'Task queue (SQS, RabbitMQ)',
        oneLiner: 'A work list. Consume, acknowledge, message gone.',
      },
      {
        id: 'log',
        name: 'Durable log (Kafka, Kinesis, Pulsar)',
        oneLiner: 'A retained, replayable, partitioned sequence with per-consumer positions.',
      },
      {
        id: 'db-table',
        name: 'A table in the database you already have',
        oneLiner: 'Rows with a status column, claimed by workers.',
      },
    ],
    criteria: [
      {
        criterion: 'Multiple independent consumers of the same event',
        values: {
          'task-queue': 'Needs one queue per consumer, fanned out by the producer or broker',
          log: 'Native: each consumer group keeps its own offset',
          'db-table': 'Possible but you are now building a broker',
        },
        favours: 'log',
      },
      {
        criterion: 'Replaying history after a bug or to build a new view',
        values: {
          'task-queue': 'Not possible: acknowledged messages are gone',
          log: 'Native, bounded by retention',
          'db-table': 'Possible if you never delete rows',
        },
        favours: 'log',
      },
      {
        criterion: 'Ordering',
        values: {
          'task-queue': 'Usually none, or a special FIFO mode with reduced throughput',
          log: 'Strict within a partition, none across partitions',
          'db-table': 'Whatever you implement, usually with a lock',
        },
        favours: 'log',
      },
      {
        criterion: 'Operational cost',
        values: {
          'task-queue': 'Low, especially managed',
          log: 'Real: partitions, retention, rebalancing, consumer lag as a first-class concern',
          'db-table': 'Almost none, until the polling load hurts the database',
        },
        favours: 'db-table',
      },
      {
        criterion: 'Throughput ceiling',
        values: {
          'task-queue': 'High',
          log: 'Very high, and horizontally scalable by partition',
          'db-table': 'Low: contention on claiming rows appears early',
        },
        favours: 'log',
      },
    ],
    rules: [
      {
        constraint: 'One producer, one consumer, modest volume, work is disposable once done',
        consequence: 'A log buys you replay and retention that nothing in the design needs',
        choose: 'task-queue',
      },
      {
        constraint: 'Several teams want to react to the same events, now and in future',
        consequence: 'Point-to-point queues force the producer to know every consumer',
        choose: 'log',
      },
      {
        constraint: 'You must be able to rebuild a derived store from history',
        consequence: 'Only retained, replayable storage makes rebuilds possible',
        choose: 'log',
      },
      {
        constraint: 'Volume is low and the team has no broker experience or on-call capacity',
        consequence: 'A broker adds an operational surface bigger than the problem',
        choose: 'db-table',
      },
    ],
    antiPattern:
      '"We put Kafka in because we might need to scale." A log you do not replay, partition, or fan out is a queue with a much larger operations bill, plus a new way to lose ordering.',
    concepts: ['queue', 'log-based-messaging', 'replay', 'retention', 'partition-ordering', 'operational-burden'],
    sources: ['kafka-docs', 'kafka-paper', 'ddia'],
  },

  {
    id: 'replicas-vs-sharding',
    title: 'Read replicas vs sharding',
    question: 'The database is the bottleneck. Do I add replicas or split the data?',
    options: [
      {
        id: 'replicas',
        name: 'Read replicas',
        oneLiner: 'More copies serving reads. Writes unchanged.',
      },
      { id: 'shard', name: 'Sharding', oneLiner: 'Split the data so each node owns a slice.' },
      {
        id: 'bigger',
        name: 'A bigger machine, plus indexes and caching',
        oneLiner: 'Remove the bottleneck instead of distributing it.',
      },
    ],
    criteria: [
      {
        criterion: 'Helps with write load',
        values: {
          replicas: 'No. Every replica applies every write, and adds leader load',
          shard: 'Yes: writes divide across shards',
          bigger: 'Yes, up to the machine limit',
        },
        favours: 'shard',
      },
      {
        criterion: 'Helps when the dataset no longer fits',
        values: {
          replicas: 'No: every replica holds everything',
          shard: 'Yes, this is the main reason to shard',
          bigger: 'Up to a point, then no',
        },
        favours: 'shard',
      },
      {
        criterion: 'Consistency impact',
        values: {
          replicas: 'Introduces replication lag and read-your-writes problems',
          shard: 'Loses cross-shard transactions and joins',
          bigger: 'None',
        },
        favours: 'bigger',
      },
      {
        criterion: 'Reversibility',
        values: {
          replicas: 'Trivial: remove a replica',
          shard: 'Very hard: resharding a live system is a multi-quarter project',
          bigger: 'Trivial',
        },
        favours: 'bigger',
      },
    ],
    rules: [
      {
        constraint: 'Reads dominate and a few hundred milliseconds of staleness is acceptable',
        consequence: 'Read capacity is the only thing missing',
        choose: 'replicas',
      },
      {
        constraint: 'Write throughput or dataset size exceeds one node, measured under real load',
        consequence: 'No number of replicas changes either',
        choose: 'shard',
      },
      {
        constraint: 'The bottleneck is a missing index, an N+1 pattern, or an uncached hot read',
        consequence: 'Distribution multiplies the same inefficiency across more machines',
        choose: 'bigger',
      },
    ],
    antiPattern:
      'Sharding to fix slow queries. Sharding does not make a query faster; it makes each node hold less data. A query that scans a table still scans a table, now on many machines, with a scatter-gather on top.',
    concepts: ['replication-for-reads', 'sharding', 'replication-lag', 'partition-key', 'index', 'vertical-scaling'],
    sources: ['ddia', 'postgres-docs', 'mysql-docs'],
  },

  {
    id: 'fanout',
    title: 'Fanout on write vs fanout on read',
    question: 'One user posts; many users need to see it. Where does the work happen?',
    options: [
      {
        id: 'write',
        name: 'Fanout on write (push)',
        oneLiner: 'Write into every follower feed at post time.',
      },
      {
        id: 'read',
        name: 'Fanout on read (pull)',
        oneLiner: 'Assemble the feed by querying the people you follow.',
      },
      { id: 'hybrid', name: 'Hybrid', oneLiner: 'Push for most, pull for the extreme accounts.' },
    ],
    criteria: [
      {
        criterion: 'Read latency',
        values: {
          write: 'One sequential read of a prepared list',
          read: 'Scatter-gather across many partitions, then merge and sort',
          hybrid: 'Prepared list plus a small merge',
        },
        favours: 'write',
      },
      {
        criterion: 'Write amplification',
        values: {
          write: 'One post becomes N writes; catastrophic for a 50M-follower account',
          read: 'One write',
          hybrid: 'Bounded: the expensive accounts are excluded from fanout',
        },
        favours: 'read',
      },
      {
        criterion: 'Cost profile',
        values: {
          write: 'Pays for every follower, even inactive ones',
          read: 'Pays per feed view',
          hybrid: 'Pays for active followers plus a merge on read',
        },
        favours: 'hybrid',
      },
      {
        criterion: 'Complexity',
        values: {
          write: 'Simple to reason about, expensive to repair when wrong',
          read: 'Simple writes, hard reads under fanout latency amplification',
          hybrid: 'Two code paths and a policy for which accounts are which',
        },
        favours: 'write',
      },
    ],
    rules: [
      {
        constraint: 'Follower counts are bounded and roughly uniform',
        consequence: 'Write amplification stays predictable',
        choose: 'write',
      },
      {
        constraint: 'A small number of accounts have follower counts orders of magnitude above the rest',
        consequence: 'Fanout on write for those accounts alone would dominate total write load',
        choose: 'hybrid',
      },
      {
        constraint: 'Feeds are read rarely relative to writes',
        consequence: 'Precomputing feeds nobody reads is wasted work',
        choose: 'read',
      },
    ],
    antiPattern:
      'Choosing one globally. Every large feed system in public writing describes some hybrid, because the follower distribution is heavy-tailed and no single strategy survives both ends of it.',
    concepts: ['fanout-on-write', 'fanout-on-read', 'hot-key', 'write-amplification', 'cross-shard-query'],
    sources: ['ddia', 'meta-eng', 'linkedin-eng'],
  },

  {
    id: 'session-vs-jwt',
    title: 'Server sessions vs signed tokens',
    question: 'How should a request prove who the caller is?',
    options: [
      {
        id: 'session',
        name: 'Opaque session id',
        oneLiner: 'A random id; the server looks up the session.',
      },
      {
        id: 'jwt',
        name: 'Signed token (JWT)',
        oneLiner: 'A self-describing token verified by signature, no lookup.',
      },
      {
        id: 'hybrid-auth',
        name: 'Short-lived token plus refresh',
        oneLiner: 'Stateless for minutes, revocable at refresh.',
      },
    ],
    criteria: [
      {
        criterion: 'Revocation',
        values: {
          session: 'Immediate: delete the record',
          jwt: 'Not possible before expiry without a denylist, which reintroduces the lookup',
          'hybrid-auth': 'Bounded by the access-token lifetime, typically minutes',
        },
        favours: 'session',
      },
      {
        criterion: 'Per-request cost',
        values: {
          session: 'A lookup in a shared store on every request',
          jwt: 'A signature check, no I/O',
          'hybrid-auth': 'A signature check, plus a lookup at refresh only',
        },
        favours: 'jwt',
      },
      {
        criterion: 'Blast radius of the auth store failing',
        values: {
          session: 'Everything stops',
          jwt: 'Nothing stops until tokens expire',
          'hybrid-auth': 'Existing sessions survive until refresh',
        },
        favours: 'jwt',
      },
      {
        criterion: 'Data freshness (roles, permissions)',
        values: {
          session: 'Always current',
          jwt: 'Stale until the token expires',
          'hybrid-auth': 'Stale for the access-token lifetime',
        },
        favours: 'session',
      },
    ],
    rules: [
      {
        constraint: 'You must be able to log someone out instantly (compromise, ban, role change)',
        consequence: 'A self-contained token cannot be recalled',
        choose: 'session',
      },
      {
        constraint: 'Services in many languages or organisations must verify identity without shared state',
        consequence: 'A central session lookup becomes a coupling point and a dependency',
        choose: 'jwt',
      },
      {
        constraint: 'You want stateless verification but bounded revocation delay',
        consequence: 'Short expiry converts a permanent problem into a minutes-long one',
        choose: 'hybrid-auth',
      },
    ],
    antiPattern:
      'Long-lived JWTs holding permissions. A demoted admin keeps admin rights until the token expires, and the only fix is a denylist, which is a session store with extra steps.',
    concepts: ['session', 'jwt', 'authn', 'authz', 'blast-radius'],
    sources: ['rfc7519', 'rfc6749', 'mdn-http'],
  },

  {
    id: 'rest-grpc-graphql',
    title: 'REST vs gRPC vs GraphQL',
    question: 'What shape should this interface take?',
    options: [
      { id: 'rest', name: 'REST over HTTP', oneLiner: 'Resources, verbs, and the whole HTTP ecosystem.' },
      { id: 'grpc', name: 'gRPC', oneLiner: 'Schema-first binary RPC over HTTP/2.' },
      { id: 'graphql', name: 'GraphQL', oneLiner: 'Client-specified queries against a typed graph.' },
    ],
    criteria: [
      {
        criterion: 'Caching by intermediaries',
        values: {
          rest: 'Free: CDNs, proxies and browsers already understand it',
          grpc: 'None: opaque bodies, POST-shaped semantics',
          graphql: 'Hard: one endpoint, one method, queries in the body',
        },
        favours: 'rest',
      },
      {
        criterion: 'Efficiency between internal services',
        values: {
          rest: 'JSON parsing and header overhead per call',
          grpc: 'Compact binary, multiplexed, streaming built in',
          graphql: 'Extra resolution layer per request',
        },
        favours: 'grpc',
      },
      {
        criterion: 'Many clients with different data needs',
        values: {
          rest: 'Over-fetching, or a proliferation of bespoke endpoints',
          grpc: 'Same problem, with a stricter schema',
          graphql: 'The problem it was designed for',
        },
        favours: 'graphql',
      },
      {
        criterion: 'Ability to reason about worst-case server cost',
        values: {
          rest: 'Each endpoint has a bounded, knowable cost',
          grpc: 'Same',
          graphql: 'A single query can trigger unbounded work without depth and cost limits',
        },
        favours: 'rest',
      },
    ],
    rules: [
      {
        constraint: 'Public API, third-party consumers, cacheable resources',
        consequence: 'Ecosystem support and cacheability dominate raw efficiency',
        choose: 'rest',
      },
      {
        constraint: 'High-volume internal service-to-service calls with a shared schema',
        consequence: 'Serialisation and connection overhead becomes a real cost line',
        choose: 'grpc',
      },
      {
        constraint: 'Many first-party clients, each needing a different slice of a connected graph',
        consequence: 'Endpoint proliferation or over-fetching becomes the dominant pain',
        choose: 'graphql',
      },
    ],
    antiPattern:
      'Choosing gRPC for a browser-facing public API because it is "faster". Browsers cannot speak it directly, you lose HTTP caching entirely, and the serialisation saving is invisible next to a 60 ms round trip.',
    concepts: ['rest', 'grpc', 'graphql', 'http-caching', 'api-design', 'n-plus-one'],
    sources: ['rfc9110', 'rfc9113', 'martin-fowler'],
  },

  {
    id: 'single-vs-multi-region',
    title: 'Single region vs multi-region',
    question: 'Do we need to run in more than one region?',
    options: [
      { id: 'single', name: 'Single region, multi-AZ', oneLiner: 'Redundant within one region.' },
      {
        id: 'passive',
        name: 'Multi-region active-passive',
        oneLiner: 'A warm standby region, promoted on disaster.',
      },
      {
        id: 'active',
        name: 'Multi-region active-active',
        oneLiner: 'Every region serves; data converges asynchronously.',
      },
    ],
    criteria: [
      {
        criterion: 'Protects against',
        values: {
          single: 'Machine and data-centre failure',
          passive: 'Regional failure, with an RTO measured in minutes to hours',
          active: 'Regional failure, with near-zero RTO',
        },
        favours: 'active',
      },
      {
        criterion: 'Consistency complexity',
        values: {
          single: 'None beyond normal replication',
          passive: 'Asynchronous cross-region replication, so failover has a real RPO',
          active: 'Concurrent writes in two places: conflicts are now a product decision',
        },
        favours: 'single',
      },
      {
        criterion: 'Cost',
        values: {
          single: 'Baseline',
          passive: 'Roughly double infrastructure, mostly idle, plus egress',
          active: 'Double infrastructure that is used, plus continuous cross-region traffic',
        },
        favours: 'single',
      },
      {
        criterion: 'User latency',
        values: {
          single: 'Distant users pay the round trip',
          passive: 'Same as single region',
          active: 'Local reads and writes for everyone',
        },
        favours: 'active',
      },
      {
        criterion: 'Does it protect against the most common outage cause',
        values: {
          single: 'No',
          passive: 'No: a bad deploy or config replicates to both regions',
          active: 'No, and it doubles the surface on which it lands',
        },
        favours: 'single',
      },
    ],
    rules: [
      {
        constraint: 'Availability target is achievable within one region and users are concentrated',
        consequence: 'Multi-region adds cost and consistency bugs without buying the missing nines',
        choose: 'single',
      },
      {
        constraint: 'A regional outage is an existential or contractual problem, but hours of RTO is survivable',
        consequence: 'A standby avoids cross-region write conflicts entirely',
        choose: 'passive',
      },
      {
        constraint: 'Users are globally distributed and latency is a product requirement',
        consequence: 'Only local writes remove the cross-ocean round trip',
        choose: 'active',
      },
    ],
    antiPattern:
      '"Serious companies are multi-region." Most outages come from deploys, configuration and dependency failures, all of which propagate to every region within seconds. Spend the budget on progressive rollout and rollback first.',
    concepts: ['multi-az', 'multi-region', 'active-active', 'active-passive', 'rpo', 'rto', 'cost'],
    sources: ['aws-well-architected', 'sre-book', 'gcp-arch'],
  },

  {
    id: 'btree-vs-lsm',
    title: 'B-tree vs LSM storage engine',
    question: 'Which write path does this workload want?',
    options: [
      { id: 'btree', name: 'B-tree', oneLiner: 'Update pages in place. Predictable reads.' },
      { id: 'lsm', name: 'LSM tree', oneLiner: 'Buffer, flush, merge. Fast sequential writes.' },
    ],
    criteria: [
      {
        criterion: 'Write throughput',
        values: { btree: 'Random writes, bounded by page updates and WAL', lsm: 'Sequential appends, much higher' },
        favours: 'lsm',
      },
      {
        criterion: 'Read predictability',
        values: {
          btree: 'One tree traversal; latency is stable',
          lsm: 'May touch several levels; bloom filters help but variance is real',
        },
        favours: 'btree',
      },
      {
        criterion: 'Background work',
        values: {
          btree: 'Vacuum or page splits, modest',
          lsm: 'Compaction competes with foreground traffic and shows up in the tail',
        },
        favours: 'btree',
      },
      {
        criterion: 'Space efficiency',
        values: { btree: 'Fragmentation from partially used pages', lsm: 'Better after compaction, worse before' },
        favours: 'lsm',
      },
    ],
    rules: [
      {
        constraint: 'Read-heavy workload with strict latency targets',
        consequence: 'Compaction-induced tail latency is unacceptable',
        choose: 'btree',
      },
      {
        constraint: 'Sustained high-volume ingest, mostly appends, reads by key or range',
        consequence: 'In-place random writes become the bottleneck',
        choose: 'lsm',
      },
    ],
    antiPattern:
      'Treating this as a database-brand decision. Several engines offer both; the question is the workload, and the answer changes per table.',
    concepts: ['btree', 'lsm-tree', 'compaction', 'write-amplification', 'read-amplification', 'tail-latency'],
    sources: ['database-internals', 'ddia', 'cassandra-docs', 'postgres-docs'],
  },

  {
    id: 'monolith-vs-services',
    title: 'Monolith, modular monolith, or services',
    question: 'How should this system be split into deployable units?',
    options: [
      { id: 'mono', name: 'Monolith', oneLiner: 'One codebase, one deploy.' },
      {
        id: 'modular',
        name: 'Modular monolith',
        oneLiner: 'Enforced internal boundaries, still one deploy.',
      },
      { id: 'services', name: 'Microservices', oneLiner: 'Independently deployable services.' },
    ],
    criteria: [
      {
        criterion: 'Transactions across the domain',
        values: {
          mono: 'One database transaction',
          modular: 'One database transaction',
          services: 'Sagas, compensations, eventual consistency',
        },
        favours: 'modular',
      },
      {
        criterion: 'Independent deployment',
        values: {
          mono: 'No: everything ships together',
          modular: 'No, but blast radius is bounded by module ownership',
          services: 'Yes, the main reason to pay the cost',
        },
        favours: 'services',
      },
      {
        criterion: 'Debugging a slow request',
        values: {
          mono: 'A profiler and a stack trace',
          modular: 'A profiler and a stack trace',
          services: 'Distributed tracing, and you must have built it',
        },
        favours: 'mono',
      },
      {
        criterion: 'Team scaling',
        values: {
          mono: 'Merge conflicts and release coordination grow with headcount',
          modular: 'Good up to a point, if boundaries are enforced by tooling',
          services: 'Teams ship without coordinating',
        },
        favours: 'services',
      },
      {
        criterion: 'Failure modes introduced',
        values: {
          mono: 'Function calls do not time out',
          modular: 'Same',
          services: 'Every call can be slow, duplicated, or partially applied',
        },
        favours: 'mono',
      },
    ],
    rules: [
      {
        constraint: 'Fewer than roughly three teams, and boundaries are still moving',
        consequence: 'Service boundaries drawn now will be wrong and expensive to move',
        choose: 'modular',
      },
      {
        constraint: 'Many teams blocked on each other to release',
        consequence: 'Deployment coupling is the real constraint, not compute',
        choose: 'services',
      },
      {
        constraint: 'One component has genuinely different scaling or isolation needs',
        consequence: 'Only that component needs extraction, not the whole system',
        choose: 'services',
      },
    ],
    antiPattern:
      '"Microservices for scale." Scaling means running more copies, which a monolith does perfectly. What services buy is deployment independence, and what they cost is distributed transactions, tracing, and a much larger failure surface.',
    concepts: ['monolith', 'modular-monolith', 'microservices', 'service-boundary', 'coupling', 'operational-burden'],
    sources: ['building-microservices', 'martin-fowler', 'fundamentals-arch'],
  },

  {
    id: 'cache-placement',
    title: 'Where should the cache live?',
    question: 'I need reads to be cheaper. Which cache, and where?',
    options: [
      { id: 'client', name: 'Client / HTTP cache', oneLiner: 'The request never leaves the device.' },
      { id: 'edge', name: 'CDN / edge', oneLiner: 'Served near the user, never reaches your origin.' },
      { id: 'shared', name: 'Shared cache tier', oneLiner: 'One consistent view for all app servers.' },
      { id: 'local', name: 'In-process cache', oneLiner: 'Nanoseconds, per server, inconsistent by design.' },
    ],
    criteria: [
      {
        criterion: 'Latency saved',
        values: {
          client: 'Everything, including the network',
          edge: 'The distance to your origin',
          shared: 'The database query, not the network hop',
          local: 'Everything except the work itself',
        },
        favours: 'client',
      },
      {
        criterion: 'Invalidation control',
        values: {
          client: 'Almost none once sent; only TTL and versioned URLs',
          edge: 'Purge APIs, with propagation delay',
          shared: 'Immediate and central',
          local: 'None: every server expires independently',
        },
        favours: 'shared',
      },
      {
        criterion: 'Consistency across users',
        values: {
          client: 'Per user by definition',
          edge: 'Per edge location',
          shared: 'Global',
          local: 'Servers actively disagree with each other',
        },
        favours: 'shared',
      },
      {
        criterion: 'Handles a hot key',
        values: {
          client: 'Perfectly',
          edge: 'Perfectly, this is what edges are for',
          shared: 'Badly: a hot key lands on one node',
          local: 'Perfectly, at the cost of staleness',
        },
        favours: 'edge',
      },
    ],
    rules: [
      {
        constraint: 'The content is public and identical for many users',
        consequence: 'Serving it repeatedly from your origin is pure waste',
        choose: 'edge',
      },
      {
        constraint: 'The value is expensive to compute and must be identical everywhere',
        consequence: 'Per-server copies would produce visible disagreement',
        choose: 'shared',
      },
      {
        constraint: 'One key is read enormously and tolerates seconds of staleness',
        consequence: 'A shared cache concentrates that key onto a single node',
        choose: 'local',
      },
      {
        constraint: 'The response is user-specific and changes rarely',
        consequence: 'The cheapest request is the one never sent',
        choose: 'client',
      },
    ],
    antiPattern:
      'Adding a shared cache in front of a database to fix latency, without checking whether the query is slow because of a missing index. You have then added staleness, a stampede risk and a new dependency to avoid writing one line of SQL.',
    concepts: ['http-caching', 'cdn', 'distributed-cache', 'local-cache', 'hot-key', 'cache-invalidation'],
    sources: ['rfc9111', 'cloudflare-blog', 'redis-docs'],
  },

  {
    id: 'deploy-strategy',
    title: 'Blue-green vs canary vs rolling',
    question: 'How should new code reach production?',
    options: [
      { id: 'rolling', name: 'Rolling', oneLiner: 'Replace instances gradually in place.' },
      { id: 'bluegreen', name: 'Blue-green', oneLiner: 'Two environments, switch all traffic at once.' },
      { id: 'canary', name: 'Canary', oneLiner: 'A small traffic slice first, watched, then widened.' },
    ],
    criteria: [
      {
        criterion: 'Blast radius of a bad release',
        values: {
          rolling: 'Grows as the rollout proceeds',
          bluegreen: '100% the instant you switch',
          canary: 'Bounded by the canary share',
        },
        favours: 'canary',
      },
      {
        criterion: 'Rollback speed',
        values: {
          rolling: 'Another rolling deploy: slow',
          bluegreen: 'Instant: switch back',
          canary: 'Instant: shift traffic away',
        },
        favours: 'bluegreen',
      },
      {
        criterion: 'Infrastructure cost',
        values: {
          rolling: 'None extra',
          bluegreen: 'Double during the switch',
          canary: 'Marginal',
        },
        favours: 'rolling',
      },
      {
        criterion: 'Requires two versions to coexist',
        values: {
          rolling: 'Yes',
          bluegreen: 'Briefly, and both talk to the same data',
          canary: 'Yes, for longer',
        },
        favours: 'bluegreen',
      },
      {
        criterion: 'Detects problems that only appear under real traffic',
        values: {
          rolling: 'Eventually, by which time most instances are updated',
          bluegreen: 'After full exposure',
          canary: 'Early, on a small population, with metrics to compare',
        },
        favours: 'canary',
      },
    ],
    rules: [
      {
        constraint: 'You have per-version metrics and enough traffic for a small slice to be statistically meaningful',
        consequence: 'You can detect a regression before most users see it',
        choose: 'canary',
      },
      {
        constraint: 'You need an instant, complete rollback and can afford double capacity briefly',
        consequence: 'Traffic switching is faster than redeploying',
        choose: 'bluegreen',
      },
      {
        constraint: 'Low traffic, simple service, strong pre-production testing',
        consequence: 'Canary analysis has too little signal to be worth the machinery',
        choose: 'rolling',
      },
    ],
    antiPattern:
      'Believing blue-green gives a safe rollback when the release included a schema change. Switching back does not un-write the data the new version created; only expand-and-contract migrations make rollback real.',
    concepts: ['canary', 'blue-green', 'rollback', 'blast-radius', 'schema-migration', 'expand-contract'],
    sources: ['sre-workbook', 'martin-fowler', 'aws-well-architected'],
  },
];

export const DECISION_BY_ID: Record<string, Decision> = Object.fromEntries(
  DECISIONS.map((d) => [d.id, d]),
);
