import type { Concept } from '@/lib/types';

/** Clusters: scaling, storage-engines, transactions. */
export const DATA_CONCEPTS: Concept[] = [
  /* ============================================================ scaling */
  {
    id: 'vertical-scaling',
    name: 'Vertical scaling',
    aliases: ['scale up', 'bigger machine'],
    oneLiner: 'Buy a bigger machine. Underrated, bounded, and often the correct first answer.',
    cluster: 'scaling',
    requires: ['scalability'],
    leadsTo: ['horizontal-scaling'],
    tensionWith: ['horizontal-scaling'],
    myth: 'Vertical scaling is amateur hour.',
    mythCorrection:
      'A single modern server handles tens of thousands of requests per second and terabytes of data. Most systems that adopt distribution to "scale" were nowhere near a machine limit; they bought distributed-systems problems for free.',
  },
  {
    id: 'horizontal-scaling',
    name: 'Horizontal scaling',
    aliases: ['scale out', 'more servers'],
    oneLiner: 'Add more machines. Requires that work can be split, which is the whole difficulty.',
    cluster: 'scaling',
    requires: ['statelessness', 'bottleneck'],
    leadsTo: ['load-distribution', 'partitioning', 'coordination-cost'],
    tensionWith: ['vertical-scaling', 'operational-burden'],
  },
  {
    id: 'coordination-cost',
    name: 'Coordination cost',
    oneLiner:
      'Every machine that must agree with another adds latency and a new way to fail. Scaling well means needing less agreement.',
    cluster: 'scaling',
    requires: ['horizontal-scaling'],
    leadsTo: ['consensus', 'sharding', 'eventual-consistency'],
  },
  {
    id: 'load-distribution',
    name: 'Load distribution',
    oneLiner:
      'How work is spread: round robin, least connections, hashed. Each has a different failure under skew.',
    cluster: 'scaling',
    requires: ['load-balancer'],
    leadsTo: ['hot-key', 'consistent-hashing'],
  },
  {
    id: 'partitioning',
    name: 'Partitioning',
    aliases: ['split the data'],
    oneLiner: 'Dividing data so no single node holds or serves all of it.',
    cluster: 'scaling',
    requires: ['horizontal-scaling'],
    leadsTo: ['sharding', 'partition-key', 'hot-partition', 'rebalancing'],
  },
  {
    id: 'sharding',
    name: 'Sharding',
    oneLiner:
      'Partitioning applied to a database, so each shard is an independent database with a slice of the data.',
    cluster: 'scaling',
    requires: ['partitioning'],
    leadsTo: ['cross-shard-query', 'resharding', 'distributed-transaction'],
    tensionWith: ['acid', 'operational-burden'],
    myth: 'Shard when the database gets big.',
    mythCorrection:
      'Shard when a single node cannot hold the working set, sustain the write rate, or meet the latency target, and you have already exhausted indexes, caching, replicas and a bigger machine. Sharding costs you joins, transactions, and easy schema change.',
  },
  {
    id: 'partition-key',
    name: 'Partition key',
    aliases: ['shard key', 'hash key'],
    oneLiner:
      'The single most consequential schema decision: it fixes what is cheap, what is expensive, and what is impossible.',
    cluster: 'scaling',
    requires: ['partitioning'],
    leadsTo: ['hot-partition', 'cross-shard-query'],
  },
  {
    id: 'cross-shard-query',
    name: 'Cross-shard query',
    oneLiner: 'Any question that spans shards becomes a scatter-gather with tail-latency problems.',
    cluster: 'scaling',
    requires: ['sharding', 'partition-key'],
    leadsTo: ['fanout-latency-amplification', 'denormalisation'],
  },
  {
    id: 'consistent-hashing',
    name: 'Consistent hashing',
    oneLiner:
      'A hash ring so that adding or removing a node moves roughly 1/N of keys instead of nearly all of them.',
    cluster: 'scaling',
    requires: ['partitioning'],
    leadsTo: ['rebalancing', 'virtual-nodes'],
  },
  {
    id: 'virtual-nodes',
    name: 'Virtual nodes',
    oneLiner:
      'Many small ring positions per physical node, which smooths skew and makes rebalancing incremental.',
    cluster: 'scaling',
    requires: ['consistent-hashing'],
    leadsTo: ['rebalancing'],
  },
  {
    id: 'rebalancing',
    name: 'Rebalancing',
    oneLiner: 'Moving data between nodes while the system is serving traffic. Always harder than it sounds.',
    cluster: 'scaling',
    requires: ['partitioning'],
    leadsTo: ['resharding', 'backpressure'],
  },
  {
    id: 'resharding',
    name: 'Resharding',
    oneLiner: 'Changing the partitioning scheme of a live system. The migration nobody budgets for.',
    cluster: 'scaling',
    requires: ['sharding', 'rebalancing'],
    leadsTo: ['schema-migration', 'cdc'],
  },
  {
    id: 'hot-partition',
    name: 'Hot partition',
    aliases: ['skew', 'uneven load'],
    oneLiner:
      'One partition receiving far more traffic than the others, so your cluster is as fast as its busiest node.',
    cluster: 'scaling',
    requires: ['partition-key'],
    leadsTo: ['hot-key', 'load-shedding'],
  },
  {
    id: 'hot-key',
    name: 'Hot key',
    aliases: ['celebrity problem', 'popular item'],
    oneLiner:
      'A single key so popular that no partitioning scheme helps, because it cannot be split by definition.',
    cluster: 'scaling',
    requires: ['hot-partition'],
    leadsTo: ['replication-for-reads', 'key-splitting', 'local-cache'],
  },
  {
    id: 'key-splitting',
    name: 'Key splitting',
    aliases: ['write sharding', 'salting'],
    oneLiner:
      'Turning one hot key into K sub-keys, trading a cheap write for a K-way read aggregation.',
    cluster: 'scaling',
    requires: ['hot-key'],
    tensionWith: ['consistency-generic'],
  },
  {
    id: 'replication-for-reads',
    name: 'Read replicas',
    oneLiner: 'Copies that serve reads, buying read throughput with staleness.',
    cluster: 'scaling',
    requires: ['leader-follower'],
    leadsTo: ['replication-lag', 'read-your-writes'],
    tensionWith: ['consistency-generic'],
    myth: 'Read replicas scale the database.',
    mythCorrection:
      'They scale reads only. Every replica applies every write, so write throughput is unchanged and each new replica adds load to the leader.',
  },
  {
    id: 'autoscaling',
    name: 'Autoscaling',
    oneLiner: 'Capacity that follows a metric, with a lag measured in minutes.',
    cluster: 'scaling',
    requires: ['elasticity'],
    leadsTo: ['capacity-headroom', 'thundering-herd'],
    tensionWith: ['cost'],
  },
  {
    id: 'backpressure',
    name: 'Backpressure',
    oneLiner:
      'Telling the producer to slow down, instead of quietly buffering until something falls over.',
    cluster: 'scaling',
    requires: ['littles-law', 'queue'],
    leadsTo: ['load-shedding', 'admission-control'],
    myth: 'A bigger queue absorbs load spikes.',
    mythCorrection:
      'An unbounded queue converts an overload problem into a latency problem and then a memory problem. Queues absorb bursts, not sustained excess arrival rate.',
  },
  {
    id: 'fanout-on-write',
    name: 'Fanout on write',
    aliases: ['push model', 'precomputed feed'],
    oneLiner: 'Do the work once at write time, so every read is a cheap lookup.',
    cluster: 'scaling',
    requires: ['queue'],
    leadsTo: ['write-amplification', 'hot-key'],
    tensionWith: ['fanout-on-read'],
  },
  {
    id: 'fanout-on-read',
    name: 'Fanout on read',
    aliases: ['pull model', 'query time merge'],
    oneLiner: 'Do the work at read time, so writes stay cheap and reads get expensive.',
    cluster: 'scaling',
    requires: ['cross-shard-query'],
    tensionWith: ['fanout-on-write'],
  },

  /* ============================================================ storage engines */
  {
    id: 'oltp',
    name: 'OLTP',
    oneLiner: 'Many small reads and writes of individual records, latency-sensitive.',
    cluster: 'storage-engines',
    leadsTo: ['index', 'btree'],
    tensionWith: ['olap'],
  },
  {
    id: 'olap',
    name: 'OLAP',
    oneLiner: 'Few enormous queries scanning many rows and few columns, throughput-sensitive.',
    cluster: 'storage-engines',
    leadsTo: ['columnar-storage'],
    tensionWith: ['oltp'],
    myth: 'One database can serve both well.',
    mythCorrection:
      'Row storage and column storage optimise opposite access patterns. Running analytics on your OLTP primary is the classic way to take down a production system with a report.',
  },
  {
    id: 'index',
    name: 'Index',
    oneLiner:
      'A second data structure that makes some reads fast and every write slower. Nothing is free.',
    cluster: 'storage-engines',
    requires: ['oltp'],
    leadsTo: ['btree', 'secondary-index', 'query-plan', 'write-amplification'],
    tensionWith: ['throughput'],
  },
  {
    id: 'btree',
    name: 'B-tree',
    oneLiner:
      'A balanced on-disk tree updated in place. Predictable reads, random writes, the default in relational engines.',
    cluster: 'storage-engines',
    requires: ['index'],
    leadsTo: ['wal', 'page-cache'],
    tensionWith: ['lsm-tree'],
  },
  {
    id: 'lsm-tree',
    name: 'LSM tree',
    oneLiner:
      'Buffer writes in memory, flush sorted files, merge later. Fast writes, read amplification, and compaction as a permanent background tax.',
    cluster: 'storage-engines',
    requires: ['index'],
    leadsTo: ['sstable', 'compaction', 'read-amplification'],
    tensionWith: ['btree'],
  },
  {
    id: 'sstable',
    name: 'SSTable',
    oneLiner: 'An immutable sorted file of key-value pairs. Immutability is what makes merging cheap.',
    cluster: 'storage-engines',
    requires: ['lsm-tree'],
    leadsTo: ['compaction'],
  },
  {
    id: 'compaction',
    name: 'Compaction',
    oneLiner:
      'Merging sorted files to reclaim space and bound read cost. It competes with your traffic for disk and CPU.',
    cluster: 'storage-engines',
    requires: ['sstable'],
    leadsTo: ['write-amplification', 'tail-latency'],
  },
  {
    id: 'wal',
    name: 'Write-ahead log',
    aliases: ['redo log', 'commit log', 'journal'],
    oneLiner:
      'Append the intent before changing the data, so a crash can be replayed instead of guessed at.',
    cluster: 'storage-engines',
    requires: ['durability'],
    leadsTo: ['replication-generic', 'cdc', 'fsync'],
  },
  {
    id: 'fsync',
    name: 'fsync and the durability boundary',
    oneLiner:
      'The point at which a write survives power loss. Everything before it is a promise, not a fact.',
    cluster: 'storage-engines',
    requires: ['wal'],
    tensionWith: ['latency'],
  },
  {
    id: 'page-cache',
    name: 'Page cache and working set',
    oneLiner:
      'Databases are fast when the hot data fits in memory, and fall off a cliff when it stops fitting.',
    cluster: 'storage-engines',
    requires: ['btree'],
    leadsTo: ['cache-generic', 'capacity-planning'],
  },
  {
    id: 'write-amplification',
    name: 'Write amplification',
    oneLiner: 'One logical write causing many physical writes, through indexes, compaction, or replication.',
    cluster: 'storage-engines',
    requires: ['index'],
    leadsTo: ['compaction'],
  },
  {
    id: 'read-amplification',
    name: 'Read amplification',
    oneLiner: 'One logical read touching many files or nodes.',
    cluster: 'storage-engines',
    requires: ['lsm-tree'],
    leadsTo: ['bloom-filter'],
  },
  {
    id: 'bloom-filter',
    name: 'Bloom filter',
    oneLiner:
      'A tiny probabilistic set that can say "definitely not here", which is enough to skip most files.',
    cluster: 'storage-engines',
    requires: ['read-amplification'],
  },
  {
    id: 'secondary-index',
    name: 'Secondary index',
    oneLiner:
      'An index on a non-key attribute. In a partitioned system it is either local and scattered, or global and expensive.',
    cluster: 'storage-engines',
    requires: ['index', 'partitioning'],
    leadsTo: ['cross-shard-query'],
  },
  {
    id: 'query-plan',
    name: 'Query planning',
    oneLiner:
      'The optimiser chooses how to execute your query; statistics decide whether it chooses well.',
    cluster: 'storage-engines',
    requires: ['index'],
    leadsTo: ['n-plus-one', 'bottleneck'],
  },
  {
    id: 'denormalisation',
    name: 'Denormalisation',
    oneLiner:
      'Storing data more than once so reads do not have to join. You trade write complexity and consistency for read speed.',
    cluster: 'storage-engines',
    requires: ['index'],
    leadsTo: ['fanout-on-write', 'eventual-consistency'],
    tensionWith: ['correctness'],
  },
  {
    id: 'columnar-storage',
    name: 'Columnar storage',
    oneLiner:
      'Store each column together so analytical scans read only what they need and compress well.',
    cluster: 'storage-engines',
    requires: ['olap'],
  },
  {
    id: 'object-storage',
    name: 'Object storage',
    oneLiner:
      'Cheap, durable, effectively unlimited storage for whole immutable blobs, addressed by key. Not a filesystem.',
    cluster: 'storage-engines',
    requires: ['durability'],
    leadsTo: ['large-object', 'cdn'],
  },
  {
    id: 'large-object',
    name: 'Large object handling',
    oneLiner:
      'Bytes that must never travel through your application: presigned uploads, ranged reads, CDN delivery.',
    cluster: 'storage-engines',
    requires: ['object-storage'],
    leadsTo: ['cdn'],
  },
  {
    id: 'block-storage',
    name: 'Block storage',
    oneLiner: 'A virtual disk attached to one machine. Fast, but tied to a failure domain.',
    cluster: 'storage-engines',
    requires: ['durability'],
  },
  {
    id: 'immutability',
    name: 'Immutability',
    oneLiner:
      'Never modify, only append. It makes caching, replication, and reasoning about history dramatically easier.',
    cluster: 'storage-engines',
    leadsTo: ['sstable', 'event-sourcing', 'cdn'],
  },
  {
    id: 'inverted-index',
    name: 'Inverted index',
    oneLiner: 'A map from term to the documents containing it. The core of every search engine.',
    cluster: 'storage-engines',
    requires: ['index'],
    leadsTo: ['tokenisation', 'relevance-ranking'],
  },
  {
    id: 'tokenisation',
    name: 'Tokenisation and analysis',
    oneLiner:
      'Turning text into the terms you will actually match on. Query and document must be analysed the same way.',
    cluster: 'storage-engines',
    requires: ['inverted-index'],
    leadsTo: ['relevance-ranking'],
  },
  {
    id: 'relevance-ranking',
    name: 'Relevance ranking',
    oneLiner: 'Matching is easy; ordering the matches so the right one is first is the actual product.',
    cluster: 'storage-engines',
    requires: ['inverted-index'],
  },
  {
    id: 'time-series-storage',
    name: 'Time-series storage',
    oneLiner:
      'Append-heavy, time-ordered data with rollups and retention, where cardinality is the thing that kills you.',
    cluster: 'storage-engines',
    requires: ['lsm-tree'],
    leadsTo: ['cardinality', 'downsampling'],
  },
  {
    id: 'downsampling',
    name: 'Downsampling and retention',
    oneLiner: 'Keep recent data at full resolution and old data as summaries, or pay forever.',
    cluster: 'storage-engines',
    requires: ['time-series-storage'],
    tensionWith: ['cost'],
  },

  {
    id: 'geospatial-index',
    name: 'Geospatial index',
    aliases: ['geohash', 'quadtree', 's2', 'r-tree', 'nearby', 'proximity search', 'find drivers near me'],
    oneLiner:
      'A scheme that folds two dimensions into one ordered key, so "near me" becomes a range scan instead of a full scan.',
    cluster: 'storage-engines',
    requires: ['index'],
    leadsTo: ['hot-partition', 'partition-key'],
    myth: 'A B-tree on latitude and another on longitude is enough to find nearby points.',
    mythCorrection:
      'Each index narrows one dimension, so the planner intersects two very wide ranges and reads far more rows than match. Spatial schemes interleave the dimensions into a single ordered key, so points close in space are close in the index.',
  },
  {
    id: 'chunking',
    name: 'Chunking and deduplication',
    aliases: ['content-defined chunking', 'rolling hash', 'dedup', 'delta sync', 'block-level sync'],
    oneLiner:
      'Splitting a large object into content-addressed pieces, so an edit transfers and stores only what actually changed.',
    cluster: 'storage-engines',
    requires: ['large-object'],
    leadsTo: ['immutability', 'cost-optimisation'],
    tensionWith: ['operational-burden'],
    myth: 'Fixed-size blocks are good enough for deduplication.',
    mythCorrection:
      'Inserting one byte at the start of a file shifts every fixed boundary, so no block matches and the whole file is re-sent. Boundaries chosen by a rolling hash of the bytes themselves survive insertion.',
  },

  /* ============================================================ transactions */
  {
    id: 'acid',
    name: 'ACID',
    oneLiner:
      'Atomicity, consistency, isolation, durability: four unrelated promises bundled under one acronym.',
    cluster: 'transactions',
    requires: ['correctness'],
    leadsTo: ['atomicity', 'isolation-levels', 'durability'],
    myth: 'NoSQL means no ACID and SQL means full ACID.',
    mythCorrection:
      'Many document and distributed stores offer real transactions, and many relational databases default to isolation levels that permit anomalies. Ask about the specific guarantee, not the category.',
  },
  {
    id: 'atomicity',
    name: 'Atomicity',
    oneLiner: 'All of it happens, or none of it does. There is no half-applied state to clean up.',
    cluster: 'transactions',
    requires: ['acid'],
    leadsTo: ['two-phase-commit', 'outbox'],
  },
  {
    id: 'isolation-levels',
    name: 'Isolation levels',
    oneLiner:
      'A menu of anomalies you agree to tolerate in exchange for concurrency. Defaults are rarely serializable.',
    cluster: 'transactions',
    requires: ['acid'],
    leadsTo: ['snapshot-isolation', 'write-skew', 'lost-update', 'mvcc'],
    tensionWith: ['throughput'],
  },
  {
    id: 'lost-update',
    name: 'Lost update',
    oneLiner: 'Two read-modify-writes race and one silently disappears.',
    cluster: 'transactions',
    requires: ['isolation-levels'],
    leadsTo: ['optimistic-concurrency', 'locking'],
  },
  {
    id: 'write-skew',
    name: 'Write skew',
    oneLiner:
      'Two transactions each read a valid state, each write something legal alone, and together break an invariant.',
    cluster: 'transactions',
    requires: ['snapshot-isolation'],
    leadsTo: ['serializability'],
  },
  {
    id: 'snapshot-isolation',
    name: 'Snapshot isolation',
    oneLiner:
      'Every transaction reads a consistent point-in-time view. Prevents most anomalies, permits write skew.',
    cluster: 'transactions',
    requires: ['isolation-levels', 'mvcc'],
    leadsTo: ['write-skew'],
  },
  {
    id: 'mvcc',
    name: 'MVCC',
    oneLiner:
      'Keep multiple versions so readers never block writers. The price is version bloat and vacuum work.',
    cluster: 'transactions',
    requires: ['isolation-levels'],
    leadsTo: ['snapshot-isolation'],
  },
  {
    id: 'locking',
    name: 'Locking',
    oneLiner: 'Serialise access by making everyone else wait. Correct, and a throughput ceiling.',
    cluster: 'transactions',
    requires: ['isolation-levels'],
    leadsTo: ['deadlock', 'two-phase-locking', 'distributed-lock'],
    tensionWith: ['throughput'],
  },
  {
    id: 'two-phase-locking',
    name: 'Two-phase locking',
    oneLiner: 'Acquire all locks, then release all locks. The classic route to serializability.',
    cluster: 'transactions',
    requires: ['locking'],
    leadsTo: ['serializability', 'deadlock'],
  },
  {
    id: 'deadlock',
    name: 'Deadlock',
    oneLiner: 'Two transactions each holding what the other needs. Someone must be killed.',
    cluster: 'transactions',
    requires: ['locking'],
    leadsTo: ['retry'],
  },
  {
    id: 'optimistic-concurrency',
    name: 'Optimistic concurrency control',
    aliases: ['compare and set', 'version check', 'etag write'],
    oneLiner:
      'Assume no conflict, detect it at commit, retry. Excellent under low contention, terrible under high.',
    cluster: 'transactions',
    requires: ['lost-update'],
    leadsTo: ['retry', 'idempotency'],
    tensionWith: ['locking'],
  },
  {
    id: 'two-phase-commit',
    name: 'Two-phase commit',
    aliases: ['2pc', 'xa'],
    oneLiner:
      'A coordinator asks everyone to prepare, then tells everyone to commit. Correct, and blocking if the coordinator dies.',
    cluster: 'transactions',
    requires: ['atomicity', 'distributed-transaction'],
    leadsTo: ['saga'],
    tensionWith: ['availability'],
    myth: '2PC gives you distributed transactions for free.',
    mythCorrection:
      'Participants hold locks through the whole protocol and cannot unilaterally decide if the coordinator vanishes. Availability drops to the product of every participant, and latency includes the slowest.',
  },
  {
    id: 'distributed-transaction',
    name: 'Distributed transaction',
    oneLiner: 'One atomic outcome across multiple independent stores. Expensive by nature.',
    cluster: 'transactions',
    requires: ['atomicity', 'sharding'],
    leadsTo: ['two-phase-commit', 'saga', 'outbox'],
  },
  {
    id: 'saga',
    name: 'Saga',
    oneLiner:
      'A sequence of local transactions with compensating actions instead of a global rollback. You trade atomicity for availability.',
    cluster: 'transactions',
    requires: ['distributed-transaction', 'idempotency'],
    leadsTo: ['eventual-consistency', 'dead-letter-queue'],
    tensionWith: ['atomicity'],
  },
  {
    id: 'outbox',
    name: 'Transactional outbox',
    oneLiner:
      'Write the event to the same database, in the same transaction, and publish it afterwards. Removes the dual-write problem.',
    cluster: 'transactions',
    requires: ['atomicity', 'queue'],
    leadsTo: ['cdc', 'at-least-once'],
  },
  {
    id: 'dual-write',
    name: 'Dual write problem',
    oneLiner:
      'Writing to a database and a queue in two steps means a crash between them leaves them disagreeing, forever.',
    cluster: 'transactions',
    requires: ['sync-vs-async'],
    leadsTo: ['outbox', 'cdc'],
  },
  {
    id: 'cdc',
    name: 'Change data capture',
    oneLiner:
      'Turning the database replication log into an event stream, so downstream systems follow committed truth.',
    cluster: 'transactions',
    requires: ['wal'],
    leadsTo: ['event-driven', 'eventual-consistency', 'resharding'],
  },
  {
    id: 'event-sourcing',
    name: 'Event sourcing',
    oneLiner:
      'Store the sequence of changes as the source of truth and derive current state. Perfect audit, painful queries and migrations.',
    cluster: 'transactions',
    requires: ['immutability'],
    leadsTo: ['cqrs'],
    tensionWith: ['maintainability'],
  },
  {
    id: 'cqrs',
    name: 'CQRS',
    oneLiner:
      'Separate the write model from one or more read models built for specific queries.',
    cluster: 'transactions',
    requires: ['denormalisation'],
    leadsTo: ['eventual-consistency'],
    tensionWith: ['operational-burden'],
  },
];
