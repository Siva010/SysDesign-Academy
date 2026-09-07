import type { Concept } from '@/lib/types';

/** Clusters: replication, coordination, consistency, messaging. */
export const DISTRIBUTED_CONCEPTS: Concept[] = [
  /* ============================================================ replication */
  {
    id: 'replication-generic',
    name: 'Replication',
    oneLiner: 'Keeping copies of the same data on several machines, for durability, reads, or locality.',
    cluster: 'replication',
    requires: ['durability'],
    leadsTo: ['leader-follower', 'multi-leader', 'leaderless', 'replication-lag'],
  },
  {
    id: 'leader-follower',
    name: 'Leader/follower replication',
    aliases: ['primary replica', 'master slave', 'single leader'],
    oneLiner:
      'One node accepts writes and streams them to followers. Simple, and the leader is your write ceiling.',
    cluster: 'replication',
    requires: ['replication-generic'],
    leadsTo: ['replication-lag', 'failover', 'replication-for-reads'],
    tensionWith: ['multi-leader'],
  },
  {
    id: 'multi-leader',
    name: 'Multi-leader replication',
    oneLiner:
      'Several nodes accept writes. Great for write locality and offline clients; you now own conflict resolution.',
    cluster: 'replication',
    requires: ['leader-follower'],
    leadsTo: ['conflict-resolution', 'crdt'],
    tensionWith: ['leader-follower', 'consistency-generic'],
  },
  {
    id: 'leaderless',
    name: 'Leaderless replication',
    aliases: ['dynamo style', 'quorum writes'],
    oneLiner:
      'Clients write to several replicas directly and read from several, using quorums instead of a leader.',
    cluster: 'replication',
    requires: ['replication-generic', 'quorum'],
    leadsTo: ['read-repair', 'hinted-handoff', 'conflict-resolution'],
  },
  {
    id: 'sync-vs-async-replication',
    name: 'Synchronous vs asynchronous replication',
    oneLiner:
      'Either the write waits for a replica, costing latency and availability, or it does not, risking loss on failover.',
    cluster: 'replication',
    requires: ['leader-follower'],
    leadsTo: ['rpo', 'replication-lag'],
    tensionWith: ['latency', 'durability'],
  },
  {
    id: 'replication-lag',
    name: 'Replication lag',
    oneLiner: 'The window in which a replica is behind. Every consistency anomaly a user sees lives in this window.',
    cluster: 'replication',
    requires: ['leader-follower'],
    leadsTo: ['read-your-writes', 'monotonic-reads', 'staleness'],
  },
  {
    id: 'failover',
    name: 'Failover',
    oneLiner: 'Promoting a replica when the leader is gone. The riskiest routine operation you own.',
    cluster: 'replication',
    requires: ['leader-follower', 'failure-detector'],
    leadsTo: ['split-brain', 'fencing-token', 'rpo'],
  },
  {
    id: 'quorum',
    name: 'Quorum',
    oneLiner:
      'Require enough nodes that any read set and any write set must share a member. Overlap is the whole trick.',
    cluster: 'replication',
    requires: ['replication-generic'],
    leadsTo: ['quorum-intersection', 'leaderless', 'consensus'],
  },
  {
    id: 'quorum-intersection',
    name: 'Quorum intersection (R + W > N)',
    oneLiner:
      'If reads and writes each touch enough replicas to overlap, a read cannot miss the latest acknowledged write.',
    cluster: 'replication',
    requires: ['quorum'],
    leadsTo: ['sloppy-quorum'],
    myth: 'R + W > N gives you strong consistency.',
    mythCorrection:
      'It gives overlap, not linearizability. Concurrent writes, failed writes that partially applied, and sloppy quorums all break the intuition. Real linearizability needs consensus.',
  },
  {
    id: 'sloppy-quorum',
    name: 'Sloppy quorum and hinted handoff',
    oneLiner:
      'Accept writes on whatever nodes are reachable and hand them back later. Availability up, guarantees down.',
    cluster: 'replication',
    requires: ['quorum-intersection'],
    leadsTo: ['hinted-handoff', 'anti-entropy'],
  },
  {
    id: 'hinted-handoff',
    name: 'Hinted handoff',
    oneLiner: 'A reachable node holds a write on behalf of an unreachable one and delivers it on recovery.',
    cluster: 'replication',
    requires: ['sloppy-quorum'],
  },
  {
    id: 'read-repair',
    name: 'Read repair',
    oneLiner: 'Notice stale replicas during a read and fix them opportunistically.',
    cluster: 'replication',
    requires: ['leaderless'],
    leadsTo: ['anti-entropy'],
  },
  {
    id: 'anti-entropy',
    name: 'Anti-entropy',
    oneLiner: 'Background comparison and repair of replicas, so rarely-read data still converges.',
    cluster: 'replication',
    requires: ['read-repair'],
  },
  {
    id: 'conflict-resolution',
    name: 'Conflict resolution',
    oneLiner:
      'When two writes happened concurrently, something must decide what the value is. That something is a product decision.',
    cluster: 'replication',
    requires: ['multi-leader'],
    leadsTo: ['last-write-wins', 'crdt', 'vector-clock'],
  },
  {
    id: 'last-write-wins',
    name: 'Last write wins',
    oneLiner: 'Pick the write with the highest timestamp. Simple, and it silently deletes data.',
    cluster: 'replication',
    requires: ['conflict-resolution', 'clock-skew'],
    tensionWith: ['correctness'],
  },
  {
    id: 'crdt',
    name: 'CRDTs',
    oneLiner:
      'Data types whose merge is defined so that concurrent updates always converge without a coordinator.',
    cluster: 'replication',
    requires: ['conflict-resolution'],
    tensionWith: ['maintainability'],
  },

  /* ============================================================ coordination */
  {
    id: 'clock-skew',
    name: 'Clock skew',
    oneLiner: 'Two machines disagree about the time, and one of them may be moving backwards.',
    cluster: 'coordination',
    leadsTo: ['logical-clock', 'last-write-wins', 'lease'],
    myth: 'NTP keeps servers close enough in sync to order events.',
    mythCorrection:
      'Ordering by wall clock across machines is unsafe at the millisecond scale. Systems that need it either use logical clocks or buy bounded uncertainty with expensive hardware and then wait it out.',
  },
  {
    id: 'logical-clock',
    name: 'Logical clocks',
    oneLiner: 'Order events by causality instead of by time, because causality is knowable.',
    cluster: 'coordination',
    requires: ['clock-skew'],
    leadsTo: ['lamport-clock', 'vector-clock', 'happens-before'],
  },
  {
    id: 'happens-before',
    name: 'Happens-before',
    oneLiner: 'A partial order: some events definitely came first, and many are simply concurrent.',
    cluster: 'coordination',
    requires: ['logical-clock'],
    leadsTo: ['causal-consistency'],
  },
  {
    id: 'lamport-clock',
    name: 'Lamport clock',
    oneLiner: 'One counter per node, advanced on send and receive. Tells you order, not concurrency.',
    cluster: 'coordination',
    requires: ['logical-clock'],
    leadsTo: ['vector-clock'],
  },
  {
    id: 'vector-clock',
    name: 'Vector clock',
    oneLiner:
      'One counter per node, carried together, so you can tell "after" from "concurrent". Costs size.',
    cluster: 'coordination',
    requires: ['lamport-clock'],
    leadsTo: ['conflict-resolution'],
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    oneLiner: 'Periodic "I am alive". Absence is evidence of nothing in particular.',
    cluster: 'coordination',
    leadsTo: ['failure-detector'],
  },
  {
    id: 'failure-detector',
    name: 'Failure detection',
    oneLiner:
      'You cannot distinguish a dead node from a slow one. Every design is a choice about which mistake to make.',
    cluster: 'coordination',
    requires: ['heartbeat'],
    leadsTo: ['leader-election', 'split-brain', 'timeout'],
  },
  {
    id: 'lease',
    name: 'Lease',
    oneLiner:
      'A lock with an expiry, so a crashed holder eventually releases it without anyone intervening.',
    cluster: 'coordination',
    requires: ['clock-skew', 'failure-detector'],
    leadsTo: ['fencing-token', 'distributed-lock', 'leader-election'],
  },
  {
    id: 'fencing-token',
    name: 'Fencing token',
    oneLiner:
      'A monotonically increasing number attached to a lock, so a resurrected old holder is rejected by the resource.',
    cluster: 'coordination',
    requires: ['lease'],
    leadsTo: ['split-brain'],
  },
  {
    id: 'distributed-lock',
    name: 'Distributed lock',
    oneLiner:
      'Mutual exclusion across machines. Safe only with leases, fencing, and a store that actually guarantees it.',
    cluster: 'coordination',
    requires: ['lease', 'fencing-token'],
    tensionWith: ['availability'],
    myth: 'A Redis key with SET NX is a safe distributed lock.',
    mythCorrection:
      'Without fencing, a paused process can wake after its lease expired and act as though it still holds the lock. Locks protect against contention, not against a stale holder, unless the protected resource checks a token.',
  },
  {
    id: 'leader-election',
    name: 'Leader election',
    oneLiner: 'Agreeing on one coordinator, which is itself a consensus problem.',
    cluster: 'coordination',
    requires: ['failure-detector', 'quorum'],
    leadsTo: ['consensus', 'split-brain', 'failover'],
  },
  {
    id: 'split-brain',
    name: 'Split brain',
    oneLiner: 'Two nodes each believe they are the leader, and both accept writes.',
    cluster: 'coordination',
    requires: ['leader-election', 'network-partition'],
    leadsTo: ['fencing-token', 'quorum'],
  },
  {
    id: 'network-partition',
    name: 'Network partition',
    oneLiner:
      'Nodes are alive but cannot reach each other. The failure mode that makes distributed systems hard.',
    cluster: 'coordination',
    requires: ['failure-detector'],
    leadsTo: ['cap', 'split-brain'],
  },
  {
    id: 'consensus',
    name: 'Consensus',
    oneLiner:
      'Getting a set of machines to agree on one value, and to stay agreed through crashes and partitions.',
    cluster: 'coordination',
    requires: ['quorum', 'leader-election'],
    leadsTo: ['raft', 'paxos', 'linearizability'],
    tensionWith: ['availability', 'latency'],
    myth: 'Consensus makes a system more available.',
    mythCorrection:
      'It makes a system correct under failure. It reduces availability: without a quorum, a consensus system deliberately stops rather than risk divergence.',
  },
  {
    id: 'raft',
    name: 'Raft',
    oneLiner:
      'Consensus decomposed into leader election, log replication, and safety, so humans can implement it.',
    cluster: 'coordination',
    requires: ['consensus'],
    leadsTo: ['replicated-state-machine'],
  },
  {
    id: 'paxos',
    name: 'Paxos',
    oneLiner: 'The original consensus algorithm: correct, minimal, and famously hard to operationalise.',
    cluster: 'coordination',
    requires: ['consensus'],
  },
  {
    id: 'replicated-state-machine',
    name: 'Replicated state machine',
    oneLiner:
      'If every replica applies the same deterministic commands in the same order, they end up identical.',
    cluster: 'coordination',
    requires: ['raft'],
    leadsTo: ['linearizability'],
  },
  {
    id: 'byzantine-failure',
    name: 'Byzantine failure',
    oneLiner:
      'A node that lies rather than stops. Relevant when you do not control every participant, and expensive when it is.',
    cluster: 'coordination',
    requires: ['consensus'],
  },
  {
    id: 'membership',
    name: 'Cluster membership',
    oneLiner: 'Agreeing on who is currently in the cluster, which is a consensus problem wearing a hat.',
    cluster: 'coordination',
    requires: ['heartbeat', 'consensus'],
    leadsTo: ['rebalancing'],
  },

  /* ============================================================ consistency */
  {
    id: 'linearizability',
    name: 'Linearizability',
    aliases: ['strong consistency', 'atomic consistency'],
    oneLiner:
      'The system behaves as if there were one copy, and every operation took effect at a single instant between its call and return.',
    cluster: 'consistency',
    requires: ['consistency-generic', 'consensus'],
    leadsTo: ['cap', 'external-consistency'],
    tensionWith: ['availability', 'latency'],
  },
  {
    id: 'serializability',
    name: 'Serializability',
    oneLiner:
      'Concurrent transactions produce a result equal to *some* serial order. Says nothing about which, or about real time.',
    cluster: 'consistency',
    requires: ['isolation-levels'],
    leadsTo: ['strict-serializability'],
    myth: 'Serializable and linearizable are the same thing.',
    mythCorrection:
      'Serializability is about multi-object transactions and admits any equivalent serial order. Linearizability is about single-object operations and respects real time. A system can have one without the other.',
  },
  {
    id: 'strict-serializability',
    name: 'Strict serializability',
    oneLiner: 'Serializability plus real-time order. The strongest practical guarantee, and the most expensive.',
    cluster: 'consistency',
    requires: ['serializability', 'linearizability'],
  },
  {
    id: 'external-consistency',
    name: 'External consistency',
    oneLiner:
      'Transaction order matches wall-clock order as observed outside the system. Requires bounded clock uncertainty and waiting it out.',
    cluster: 'consistency',
    requires: ['linearizability', 'clock-skew'],
  },
  {
    id: 'eventual-consistency',
    name: 'Eventual consistency',
    oneLiner:
      'If writes stop, replicas converge. It says nothing about how long, or what you see meanwhile.',
    cluster: 'consistency',
    requires: ['replication-lag'],
    leadsTo: ['causal-consistency', 'staleness', 'conflict-resolution'],
    myth: 'Eventual consistency is a weaker, worse choice.',
    mythCorrection:
      'It is the correct choice whenever a slightly stale answer is more valuable than no answer. Likes, view counts, search indexes, feeds and caches are all deliberately eventually consistent, and users prefer it.',
  },
  {
    id: 'causal-consistency',
    name: 'Causal consistency',
    oneLiner:
      'If A caused B, nobody sees B without A. The strongest model that survives a partition.',
    cluster: 'consistency',
    requires: ['happens-before', 'eventual-consistency'],
    leadsTo: ['session-guarantees'],
  },
  {
    id: 'session-guarantees',
    name: 'Session guarantees',
    oneLiner:
      'Per-user promises that make eventual consistency feel correct: read your writes, monotonic reads, monotonic writes.',
    cluster: 'consistency',
    requires: ['causal-consistency'],
    leadsTo: ['read-your-writes', 'monotonic-reads'],
  },
  {
    id: 'read-your-writes',
    name: 'Read your writes',
    oneLiner: 'A user always sees their own update, even when everyone else has not yet.',
    cluster: 'consistency',
    requires: ['replication-lag'],
    leadsTo: ['sticky-sessions'],
  },
  {
    id: 'monotonic-reads',
    name: 'Monotonic reads',
    oneLiner: 'Time never appears to run backwards for one user, even if replicas disagree.',
    cluster: 'consistency',
    requires: ['replication-lag'],
  },
  {
    id: 'staleness',
    name: 'Staleness',
    oneLiner: 'How out of date an answer may be. The number that should be in your requirements, and rarely is.',
    cluster: 'consistency',
    requires: ['eventual-consistency'],
    leadsTo: ['ttl', 'bounded-staleness'],
    tensionWith: ['consistency-generic'],
  },
  {
    id: 'bounded-staleness',
    name: 'Bounded staleness',
    oneLiner: 'A contract: never more than N seconds or K versions behind. Useful, and enforceable.',
    cluster: 'consistency',
    requires: ['staleness'],
  },
  {
    id: 'cap',
    name: 'CAP theorem',
    oneLiner:
      'When a partition happens, you must choose between answering (availability) and being right (linearizability).',
    cluster: 'consistency',
    requires: ['network-partition', 'linearizability'],
    leadsTo: ['pacelc'],
    myth: 'CAP means pick two of three.',
    mythCorrection:
      'Partitions are not optional; the network will partition. CAP is a choice between C and A *during a partition only*, and real systems make that choice per operation, not per database.',
  },
  {
    id: 'pacelc',
    name: 'PACELC',
    oneLiner:
      'During a partition, choose availability or consistency; else, in normal operation, choose latency or consistency. The second half is what you live with daily.',
    cluster: 'consistency',
    requires: ['cap'],
  },

  /* ============================================================ messaging */
  {
    id: 'queue',
    name: 'Queue',
    oneLiner:
      'A buffer that lets a fast producer and a slow consumer coexist, and turns a synchronous failure into a delay.',
    cluster: 'messaging',
    requires: ['sync-vs-async'],
    leadsTo: ['backpressure', 'at-least-once', 'dead-letter-queue', 'queue-depth'],
  },
  {
    id: 'queue-depth',
    name: 'Queue depth as a signal',
    oneLiner:
      'A growing queue means arrival rate exceeds service rate. It is a leading indicator, not a problem to be solved with more storage.',
    cluster: 'messaging',
    requires: ['queue', 'littles-law'],
    leadsTo: ['backpressure', 'load-shedding'],
  },
  {
    id: 'pubsub',
    name: 'Publish/subscribe',
    oneLiner: 'One message, many independent consumers, none of whom the producer knows about.',
    cluster: 'messaging',
    requires: ['queue'],
    leadsTo: ['event-driven', 'fanout-on-write'],
  },
  {
    id: 'log-based-messaging',
    name: 'Log-based messaging',
    aliases: ['kafka model', 'commit log', 'partitioned log'],
    oneLiner:
      'An append-only, replayable, retained log where consumers track their own position instead of the broker deleting on ack.',
    cluster: 'messaging',
    requires: ['pubsub', 'immutability'],
    leadsTo: ['offset', 'replay', 'partition-ordering'],
    tensionWith: ['queue'],
  },
  {
    id: 'partition-ordering',
    name: 'Ordering within a partition',
    oneLiner:
      'Ordering is guaranteed inside a partition and nowhere else. Your partition key decides what stays ordered.',
    cluster: 'messaging',
    requires: ['log-based-messaging', 'partition-key'],
    leadsTo: ['head-of-line-blocking'],
    myth: 'Kafka preserves message order.',
    mythCorrection:
      'It preserves order per partition. Anything that must be ordered relative to something else has to land in the same partition, which usually means the same key, which reintroduces hot partitions.',
  },
  {
    id: 'consumer-group',
    name: 'Consumer group',
    oneLiner:
      'A set of consumers splitting partitions between them; parallelism is capped by partition count.',
    cluster: 'messaging',
    requires: ['log-based-messaging'],
    leadsTo: ['rebalancing'],
  },
  {
    id: 'offset',
    name: 'Offsets and checkpointing',
    oneLiner:
      'The consumer records how far it got. When you commit that position decides whether you lose or duplicate on crash.',
    cluster: 'messaging',
    requires: ['log-based-messaging'],
    leadsTo: ['at-least-once', 'at-most-once'],
  },
  {
    id: 'replay',
    name: 'Replay',
    oneLiner:
      'Reprocessing history to rebuild a derived store or fix a bug. Only possible if the log is retained and consumers are idempotent.',
    cluster: 'messaging',
    requires: ['log-based-messaging', 'idempotency'],
    leadsTo: ['retention'],
  },
  {
    id: 'retention',
    name: 'Retention',
    oneLiner: 'How long the log keeps data, which bounds how far you can replay and how much you pay.',
    cluster: 'messaging',
    requires: ['log-based-messaging'],
    tensionWith: ['cost'],
  },
  {
    id: 'at-most-once',
    name: 'At-most-once delivery',
    oneLiner: 'Never duplicated, sometimes lost. Acceptable for data you can afford to drop.',
    cluster: 'messaging',
    requires: ['offset'],
    tensionWith: ['at-least-once'],
  },
  {
    id: 'at-least-once',
    name: 'At-least-once delivery',
    oneLiner: 'Never lost, sometimes duplicated. The default in practice, and the reason idempotency exists.',
    cluster: 'messaging',
    requires: ['offset', 'retry'],
    leadsTo: ['idempotency', 'duplicate-processing'],
  },
  {
    id: 'duplicate-processing',
    name: 'Duplicate processing',
    oneLiner:
      'The same message handled twice: because of a retry, a rebalance, or a consumer that crashed after acting and before committing.',
    cluster: 'messaging',
    requires: ['at-least-once'],
    leadsTo: ['idempotency', 'idempotency-key'],
  },
  {
    id: 'exactly-once',
    name: 'Exactly-once (the myth)',
    oneLiner: 'Exactly-once *delivery* over an unreliable network is impossible. Exactly-once *effect* is achievable.',
    cluster: 'messaging',
    requires: ['duplicate-processing'],
    leadsTo: ['effectively-once', 'idempotency'],
    myth: 'Some brokers give you exactly-once delivery.',
    mythCorrection:
      'What they give you is deduplicated writes inside their own transactional boundary. The moment the effect leaves that boundary, charging a card, sending an email, the guarantee is yours to build with idempotency keys.',
  },
  {
    id: 'effectively-once',
    name: 'Effectively-once processing',
    oneLiner:
      'At-least-once delivery plus an idempotent effect equals a result indistinguishable from exactly-once.',
    cluster: 'messaging',
    requires: ['exactly-once', 'idempotency'],
  },
  {
    id: 'idempotency',
    name: 'Idempotency',
    oneLiner: 'Doing it twice has the same effect as doing it once. The load-bearing property of every retry.',
    cluster: 'messaging',
    requires: ['correctness'],
    leadsTo: ['idempotency-key', 'retry', 'effectively-once'],
  },
  {
    id: 'idempotency-key',
    name: 'Idempotency key',
    oneLiner:
      'A caller-supplied unique id, stored with the result, so a repeat returns the original outcome instead of doing it again.',
    cluster: 'messaging',
    requires: ['idempotency', 'atomicity'],
    leadsTo: ['outbox'],
  },
  {
    id: 'dead-letter-queue',
    name: 'Dead-letter queue',
    oneLiner:
      'Where messages go after failing too many times, so one bad message cannot block a partition forever.',
    cluster: 'messaging',
    requires: ['queue', 'retry'],
    leadsTo: ['poison-message'],
  },
  {
    id: 'poison-message',
    name: 'Poison message',
    oneLiner: 'A message that always fails, retried forever, consuming the capacity of everything behind it.',
    cluster: 'messaging',
    requires: ['dead-letter-queue', 'head-of-line-blocking'],
  },
  {
    id: 'stream-processing',
    name: 'Stream processing',
    oneLiner:
      'Continuous computation over unbounded data, where the hard parts are time, ordering and state.',
    cluster: 'messaging',
    requires: ['log-based-messaging'],
    leadsTo: ['windowing', 'watermark'],
  },
  {
    id: 'windowing',
    name: 'Windowing',
    oneLiner: 'Cutting an infinite stream into finite chunks so aggregation can produce an answer.',
    cluster: 'messaging',
    requires: ['stream-processing'],
    leadsTo: ['watermark'],
  },
  {
    id: 'watermark',
    name: 'Watermarks and late data',
    oneLiner:
      'A decision about when to stop waiting for stragglers. Event time and processing time are never the same.',
    cluster: 'messaging',
    requires: ['windowing'],
    tensionWith: ['correctness', 'latency'],
  },
  {
    id: 'stream-join',
    name: 'Stream join',
    aliases: ['correlating events', 'attribution', 'joining two streams', 'enrichment'],
    oneLiner:
      'Correlating events from two streams that arrive at different times, which forces a decision about how long to wait and how much state to hold.',
    cluster: 'messaging',
    requires: ['stream-processing'],
    leadsTo: ['windowing', 'watermark'],
    tensionWith: ['cost', 'correctness'],
    myth: 'A stream join is just a database join over two topics.',
    mythCorrection:
      'A database join sees both sides in full. A stream join sees one side now and the other side maybe later, so it must hold state for a bounded window and accept that anything arriving after the window closes will never match.',
  },
  {
    id: 'delay-queue',
    name: 'Delayed and scheduled execution',
    aliases: ['scheduler', 'cron at scale', 'reminders', 'timers', 'run this later'],
    oneLiner:
      'Durably remembering to do something at a future time, once, when the machine that made the promise may not exist by then.',
    cluster: 'messaging',
    requires: ['queue'],
    leadsTo: ['at-least-once', 'lease', 'idempotency'],
    tensionWith: ['cost'],
    myth: 'A cron entry on a server is a scheduler.',
    mythCorrection:
      'One machine running cron silently skips work whenever it is down; two machines running the same cron do everything twice. Scheduling at scale is a durability, leasing and idempotency problem, not a timer problem.',
  },
];
