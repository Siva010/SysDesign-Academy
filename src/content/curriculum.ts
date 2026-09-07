import type { Level, Module } from '@/lib/types';

/**
 * The curriculum spine. See docs/01-curriculum-architecture.md.
 *
 * Levels are organised by the *force* that dominates them, not by technology. Each level
 * ends with a system that works and then breaks in a way that motivates the next level.
 */

export const LEVELS: Level[] = [
  {
    id: 'l0',
    index: 0,
    name: 'How Machines Talk',
    constraint: 'The speed of light, and the shape of a request',
    outcome:
      'You can trace a single click from a keystroke to a database row and back, and say where every millisecond went.',
    breaksBecause:
      'One request is easy. The design only becomes interesting when a second request arrives before the first has finished.',
    moduleIds: ['l0-lifecycle', 'l0-transport', 'l0-naming', 'l0-physics'],
  },
  {
    id: 'l1',
    index: 1,
    name: 'One Box',
    constraint: "A single machine's limits",
    outcome:
      'You can build a correct single-server application, measure its ceiling, and name the resource that runs out first.',
    breaksBecause:
      'A machine has a finite number of cores, sockets, and disk operations per second, and someone is about to send you more traffic than that.',
    moduleIds: ['l1-anatomy', 'l1-storing', 'l1-concurrency', 'l1-ceiling'],
  },
  {
    id: 'l2',
    index: 2,
    name: 'Scaling Out',
    constraint: 'Concurrent load beyond one machine',
    outcome:
      'You can put a stateless tier behind a load balancer, cut work with caching and a CDN, and move slow work off the request path.',
    breaksBecause:
      'Every machine you add still talks to one database, and the load is never spread as evenly as the diagram suggests.',
    moduleIds: ['l2-more-machines', 'l2-less-work', 'l2-later-work', 'l2-uneven'],
  },
  {
    id: 'l3',
    index: 3,
    name: 'Data at Scale',
    constraint: 'Storage volume, write rate, and correctness under concurrency',
    outcome:
      'You can choose a storage engine, design indexes and a partition key, reason about isolation levels, and decide when to shard.',
    breaksBecause:
      'The moment data lives on more than one machine, every guarantee you relied on becomes a distributed-systems question.',
    moduleIds: ['l3-engines', 'l3-transactions', 'l3-replication', 'l3-partitioning', 'l3-specialised'],
  },
  {
    id: 'l4',
    index: 4,
    name: 'Coordination',
    constraint: 'No shared clock, no reliable network, no way to tell dead from slow',
    outcome:
      'You can reason about consistency models, quorums, consensus, and delivery semantics, and say what each costs.',
    breaksBecause:
      'Correct under failure is not the same as available under failure, and production cares about both.',
    moduleIds: ['l4-uncertainty', 'l4-agreement', 'l4-models', 'l4-moving-work'],
  },
  {
    id: 'l5',
    index: 5,
    name: 'Keeping It Up',
    constraint: 'Failure as the normal case, not the exception',
    outcome:
      'You can set targets, predict how a local failure becomes an outage, and place the defences that stop it.',
    breaksBecause:
      'A system that survives failure still has to survive being changed by people every day.',
    moduleIds: ['l5-targets', 'l5-spread', 'l5-defences', 'l5-losing-big'],
  },
  {
    id: 'l6',
    index: 6,
    name: 'Running It',
    constraint: 'Change, visibility, adversaries, and money',
    outcome:
      'You can deploy and migrate without downtime, instrument a system you can debug, defend it, and know what it costs.',
    breaksBecause:
      'You now have every primitive. What you do not yet have is the judgment to combine them under a real requirement.',
    moduleIds: ['l6-change', 'l6-seeing', 'l6-adversaries', 'l6-economics'],
  },
  {
    id: 'l7',
    index: 7,
    name: 'Real Systems',
    constraint: 'Composition under requirements that conflict',
    outcome:
      'You can derive a full design under pressure, evolve it as constraints change, and defend every decision.',
    breaksBecause:
      'Real problems arrive without requirements, with a legacy system attached, and with an organisation around them.',
    moduleIds: ['l7-method', 'l7-primitives', 'l7-library'],
  },
  {
    id: 'l8',
    index: 8,
    name: 'Judgment',
    constraint: 'Ambiguity, legacy, and organisations',
    outcome:
      'You can choose the simplest system that meets the real requirement, migrate toward it safely, and justify it to people who disagree.',
    breaksBecause:
      'Nothing breaks. This is where the curriculum stops teaching and starts testing you on systems it never showed you.',
    moduleIds: ['l8-ambiguity', 'l8-evolution', 'l8-organisation', 'l8-capstone'],
  },
];

export const MODULES: Module[] = [
  /* ---------------------------------------------------------------- level 0 */
  {
    id: 'l0-lifecycle',
    levelId: 'l0',
    order: 1,
    name: 'The life of a request',
    question: 'What actually happens between the click and the pixel?',
  },
  {
    id: 'l0-transport',
    levelId: 'l0',
    order: 2,
    name: 'Getting bytes there',
    question: 'How do bytes arrive reliably, and what does reliability cost?',
  },
  {
    id: 'l0-naming',
    levelId: 'l0',
    order: 3,
    name: 'Names, addresses and routes',
    question: 'How does a name become a machine, and which machine?',
  },
  {
    id: 'l0-physics',
    levelId: 'l0',
    order: 4,
    name: 'The physical floor',
    question: 'What is impossible no matter how good your code is?',
  },

  /* ---------------------------------------------------------------- level 1 */
  {
    id: 'l1-anatomy',
    levelId: 'l1',
    order: 1,
    name: 'Anatomy of a server',
    question: 'What is a server actually doing with your request?',
  },
  {
    id: 'l1-storing',
    levelId: 'l1',
    order: 2,
    name: 'Keeping things',
    question: 'Where does the data live, and how do you find it again?',
  },
  {
    id: 'l1-concurrency',
    levelId: 'l1',
    order: 3,
    name: 'Two requests at once',
    question: 'What goes wrong when things happen at the same time?',
  },
  {
    id: 'l1-ceiling',
    levelId: 'l1',
    order: 4,
    name: 'Finding the ceiling',
    question: 'Where does one machine stop, and how would you know?',
  },

  /* ---------------------------------------------------------------- level 2 */
  {
    id: 'l2-more-machines',
    levelId: 'l2',
    order: 1,
    name: 'More machines',
    question: 'How do you use more than one machine without breaking correctness?',
  },
  {
    id: 'l2-less-work',
    levelId: 'l2',
    order: 2,
    name: 'Doing less work',
    question: 'How do you avoid doing the work at all?',
  },
  {
    id: 'l2-later-work',
    levelId: 'l2',
    order: 3,
    name: 'Doing it later',
    question: 'How do you stop making the user wait for work they do not need to see?',
  },
  {
    id: 'l2-uneven',
    levelId: 'l2',
    order: 4,
    name: 'When load is not even',
    question: 'What happens when a small fraction of the traffic is most of the traffic?',
  },

  /* ---------------------------------------------------------------- level 3 */
  {
    id: 'l3-engines',
    levelId: 'l3',
    order: 1,
    name: 'Inside the database',
    question: 'How does a database actually store and find things?',
  },
  {
    id: 'l3-transactions',
    levelId: 'l3',
    order: 2,
    name: 'Promises under concurrency',
    question: 'What does the database actually guarantee when things overlap?',
  },
  {
    id: 'l3-replication',
    levelId: 'l3',
    order: 3,
    name: 'Copies',
    question: 'How does data survive a machine dying, and what does a copy cost?',
  },
  {
    id: 'l3-partitioning',
    levelId: 'l3',
    order: 4,
    name: 'Splitting',
    question: 'What do you do when the data no longer fits on one machine?',
  },
  {
    id: 'l3-specialised',
    levelId: 'l3',
    order: 5,
    name: 'Other shapes of store',
    question: 'When is a relational database the wrong tool?',
  },

  /* ---------------------------------------------------------------- level 4 */
  {
    id: 'l4-uncertainty',
    levelId: 'l4',
    order: 1,
    name: 'Living without certainty',
    question: 'Why can machines not simply agree on what happened?',
  },
  {
    id: 'l4-agreement',
    levelId: 'l4',
    order: 2,
    name: 'Agreeing anyway',
    question: 'How do machines reach agreement despite crashes and partitions?',
  },
  {
    id: 'l4-models',
    levelId: 'l4',
    order: 3,
    name: 'What you promise a reader',
    question: 'Which consistency model does this system actually need?',
  },
  {
    id: 'l4-moving-work',
    levelId: 'l4',
    order: 4,
    name: 'Moving work between machines',
    question: 'How do you hand off work without losing it or doing it twice?',
  },

  /* ---------------------------------------------------------------- level 5 */
  {
    id: 'l5-targets',
    levelId: 'l5',
    order: 1,
    name: 'How reliable is reliable enough',
    question: 'What are you promising, to whom, and how would you measure it?',
  },
  {
    id: 'l5-spread',
    levelId: 'l5',
    order: 2,
    name: 'How failures spread',
    question: 'How does one slow dependency become a total outage?',
  },
  {
    id: 'l5-defences',
    levelId: 'l5',
    order: 3,
    name: 'Stopping the spread',
    question: 'Which defences actually work, and what do they cost when nothing is wrong?',
  },
  {
    id: 'l5-losing-big',
    levelId: 'l5',
    order: 4,
    name: 'Losing something large',
    question: 'What is the plan when a zone, a region, or the data itself is gone?',
  },

  /* ---------------------------------------------------------------- level 6 */
  {
    id: 'l6-change',
    levelId: 'l6',
    order: 1,
    name: 'Changing a running system',
    question: 'How do you deploy and migrate without downtime or data loss?',
  },
  {
    id: 'l6-seeing',
    levelId: 'l6',
    order: 2,
    name: 'Seeing inside',
    question: 'How do you answer a question about production you did not anticipate?',
  },
  {
    id: 'l6-adversaries',
    levelId: 'l6',
    order: 3,
    name: 'Adversaries and abuse',
    question: 'Who is attacking or abusing this, and what actually stops them?',
  },
  {
    id: 'l6-economics',
    levelId: 'l6',
    order: 4,
    name: 'What it costs',
    question: 'Is the better architecture worth what it costs to build and run?',
  },

  /* ---------------------------------------------------------------- level 7 */
  {
    id: 'l7-method',
    levelId: 'l7',
    order: 1,
    name: 'The method',
    question: 'How do you attack a design question you have never seen?',
  },
  {
    id: 'l7-primitives',
    levelId: 'l7',
    order: 2,
    name: 'The primitives underneath',
    question: 'Which handful of problems do all of these systems reduce to?',
  },
  {
    id: 'l7-library',
    levelId: 'l7',
    order: 3,
    name: 'Worked systems',
    question: 'Can you derive these designs, round by round, under pressure?',
    library: 'case-studies',
  },

  /* ---------------------------------------------------------------- level 8 */
  {
    id: 'l8-ambiguity',
    levelId: 'l8',
    order: 1,
    name: 'When the requirement is wrong',
    question: 'What do you do when the brief itself is the problem?',
  },
  {
    id: 'l8-evolution',
    levelId: 'l8',
    order: 2,
    name: 'Systems over years',
    question: 'How do you get from the system you have to the system you need?',
  },
  {
    id: 'l8-organisation',
    levelId: 'l8',
    order: 3,
    name: 'People shape architecture',
    question: 'Why does the org chart end up in the system diagram?',
  },
  {
    id: 'l8-capstone',
    levelId: 'l8',
    order: 4,
    name: 'Capstone',
    question: 'Can you derive a design for a system nobody showed you?',
  },
];

export const LEVEL_BY_INDEX: Record<number, Level> = Object.fromEntries(
  LEVELS.map((l) => [l.index, l]),
);

export const MODULE_BY_ID: Record<string, Module> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
);

export function modulesForLevel(levelIndex: number): Module[] {
  const level = LEVEL_BY_INDEX[levelIndex];
  if (!level) return [];
  return level.moduleIds
    .map((id) => MODULE_BY_ID[id])
    .filter((m): m is Module => Boolean(m))
    .sort((a, b) => a.order - b.order);
}

/**
 * Coverage map: every topic list in the master brief (section 4) mapped to the concepts
 * that own it. The validator uses this to prove nothing in the brief fell off the plan.
 */
export const BRIEF_COVERAGE: Record<string, string[]> = {
  Foundations: [
    'functional-requirements',
    'non-functional-requirements',
    'latency',
    'throughput',
    'availability',
    'reliability',
    'durability',
    'scalability',
    'consistency-generic',
    'fault-tolerance',
    'elasticity',
    'correctness',
    'operability',
    'maintainability',
    'cost',
  ],
  Networking: [
    'dns',
    'http',
    'tls',
    'tcp',
    'udp',
    'ip',
    'keep-alive',
    'connection-pooling',
    'proxy',
    'reverse-proxy',
    'load-balancer',
    'cdn',
    'anycast',
    'geo-routing',
    'service-discovery',
  ],
  'Application architecture': [
    'monolith',
    'modular-monolith',
    'microservices',
    'service-boundary',
    'api-design',
    'rest',
    'rpc',
    'grpc',
    'graphql',
    'event-driven',
    'sync-vs-async',
  ],
  Scaling: [
    'vertical-scaling',
    'horizontal-scaling',
    'statelessness',
    'session-state',
    'partitioning',
    'sharding',
    'consistent-hashing',
    'load-distribution',
    'hot-partition',
    'autoscaling',
    'backpressure',
  ],
  Databases: [
    'oltp',
    'olap',
    'index',
    'btree',
    'lsm-tree',
    'acid',
    'isolation-levels',
    'locking',
    'mvcc',
    'replication-generic',
    'leader-follower',
    'multi-leader',
    'leaderless',
    'replication-for-reads',
    'failover',
    'rebalancing',
    'cap',
    'pacelc',
    'distributed-transaction',
    'two-phase-commit',
    'saga',
    'cdc',
  ],
  Caching: [
    'http-caching',
    'cdn',
    'cache-generic',
    'distributed-cache',
    'cache-aside',
    'write-through',
    'ttl',
    'eviction',
    'cache-invalidation',
    'cache-stampede',
    'cache-penetration',
    'hot-key',
  ],
  Messaging: [
    'queue',
    'pubsub',
    'log-based-messaging',
    'consumer-group',
    'partition-ordering',
    'offset',
    'replay',
    'retention',
    'at-most-once',
    'at-least-once',
    'effectively-once',
    'idempotency',
    'dead-letter-queue',
    'retry',
    'exponential-backoff',
    'poison-message',
  ],
  'Distributed systems': [
    'clock-skew',
    'logical-clock',
    'lamport-clock',
    'vector-clock',
    'leader-election',
    'consensus',
    'raft',
    'paxos',
    'quorum',
    'lease',
    'heartbeat',
    'failure-detector',
    'split-brain',
    'network-partition',
    'byzantine-failure',
    'eventual-consistency',
    'linearizability',
    'serializability',
    'causal-consistency',
    'monotonic-reads',
    'read-your-writes',
    'replication-lag',
    'conflict-resolution',
  ],
  'Reliability engineering': [
    'sli',
    'slo',
    'sla',
    'error-budget',
    'availability-math',
    'redundancy',
    'graceful-degradation',
    'failover',
    'retry',
    'circuit-breaker',
    'bulkhead',
    'timeout',
    'load-shedding',
    'admission-control',
    'health-check',
    'disaster-recovery',
    'rpo',
    'rto',
    'multi-az',
    'multi-region',
    'active-active',
    'active-passive',
  ],
  Storage: [
    'object-storage',
    'block-storage',
    'immutability',
    'wal',
    'sstable',
    'compaction',
    'durability',
    'backup',
  ],
  Search: ['inverted-index', 'tokenisation', 'relevance-ranking', 'secondary-index'],
  Observability: [
    'logs',
    'metrics',
    'traces',
    'correlation-id',
    'structured-logging',
    'golden-signals',
    'alerting',
    'sampling',
    'cardinality',
  ],
  Security: [
    'authn',
    'authz',
    'session',
    'oauth',
    'jwt',
    'secrets-management',
    'encryption-in-transit',
    'encryption-at-rest',
    'key-management',
    'rate-limiting',
    'ddos',
    'threat-modeling',
    'least-privilege',
    'tenant-isolation',
    'audit-log',
  ],
  'Operational architecture': [
    'ci-cd',
    'blue-green',
    'canary',
    'feature-flag',
    'schema-migration',
    'backward-compatibility',
    'versioning',
    'rollback',
    'iac',
    'capacity-planning',
    'cost-optimisation',
    'incident-response',
  ],
  'Production realities': [
    'tail-latency',
    'coordinated-omission',
    'thundering-herd',
    'retry-amplification',
    'cache-stampede',
    'hot-partition',
    'noisy-neighbour',
    'connection-exhaustion',
    'queue-depth',
    'backpressure',
    'load-shedding',
    'graceful-degradation',
    'cascading-failure',
    'control-plane-vs-data-plane',
    'blast-radius',
    'fault-domain',
    'capacity-headroom',
  ],
};
