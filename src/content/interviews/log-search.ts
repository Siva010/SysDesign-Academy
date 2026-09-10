import type { Scenario } from './types';

/**
 * The inversion interview. It sounds like a search problem and most candidates answer it as one,
 * reaching for the machinery built for a product catalogue. That machinery assumes an index is
 * written once and read many times; here it is written a quarter of a million times for every
 * read. Being assessed: whether the candidate notices the ratio, and lets it talk them out of
 * the index they were about to build.
 */
export const LOG_SEARCH: Scenario = {
  id: 'log-search',
  title: 'Design log search for a large fleet',
  opening:
    'Design log storage and search for fifty thousand services. Engineers need to search the last thirty days, especially during an incident.',
  difficulty: 'advanced',
  minutes: 40,
  caseStudyId: 'log-search',
  assesses: [
    'requirements',
    'estimation',
    'architecture',
    'data-modelling',
    'scalability',
    'reliability',
    'failure-handling',
    'trade-offs',
    'communication',
    'adaptability',
  ],
  startPhase: 'open',
  phases: [
    {
      id: 'open',
      kind: 'clarify',
      prompt:
        'Design log storage and search for fifty thousand services. Engineers need to search the last thirty days, especially during an incident.',
      note: 'The instinctive answer to this one is a product name. Resist it for a minute.',
      next: 'estimate',
      choices: [
        {
          id: 'clarify-queries',
          text: 'I want to know who queries this and how. Is it a handful of engineers during incidents, or dashboards polling constantly? And what does a typical query look like - one service in the last hour, or a free-text string across the whole month? The first is answered by partitioning alone; the second is where all the cost is.',
          quality: 'strong',
          scores: { requirements: 2, architecture: 1, communication: 1 },
          reaction:
            'A few dozen engineers, a couple of searches a second normally, spiking in an incident. Most queries are one service, recent, filtered by severity. Some are a trace id across the whole window.',
          coaching:
            'Asking about the query pattern before the volume is what lets you avoid building an index nobody needs. The trace-id case is the tension the whole design turns on, and you have already surfaced it.',
          concepts: ['requirement-clarification', 'index'],
        },
        {
          id: 'clarify-volume',
          text: 'How many log lines a second, and how big is an average line?',
          quality: 'adequate',
          scores: { requirements: 1, estimation: 1 },
          reaction: 'Half a million lines a second, about five hundred bytes each. What else?',
          coaching:
            'Ingest volume matters, but it is only half the ratio. How often anyone reads the data is the number that decides how much indexing is worth paying for.',
          concepts: ['back-of-envelope'],
        },
        {
          id: 'clarify-product',
          text: 'I would stand up a search cluster, send every log line to it, and index all the fields so any query is fast.',
          quality: 'weak',
          scores: { requirements: -2, 'trade-offs': -1 },
          reaction:
            'Half a million lines a second into a full inverted index, for two searches a second. What is the index costing you?',
          coaching:
            'Reaching for the tool before the ratio is the trap here. A full-text index is excellent at the job it was designed for, which is many reads amortising one write - the opposite of this workload.',
          concepts: ['inverted-index', 'write-amplification'],
        },
      ],
    },

    {
      id: 'estimate',
      kind: 'estimate',
      prompt:
        'Half a million lines a second, five hundred bytes each, thirty days, and a couple of searches a second. What do the numbers say?',
      next: 'index',
      nextIfWeak: 'estimate-help',
      choices: [
        {
          id: 'est-good',
          text: 'Two hundred and fifty megabytes a second, which is about twenty-one terabytes a day raw. Logs compress well, maybe ten to one, so two terabytes a day and about sixty-three for the month. But the number that decides the design is the ratio: half a million writes a second against two reads is about two hundred and fifty thousand to one. A product search index runs that ratio the other way, so everything that is obviously right for a catalogue is obviously wrong here.',
          quality: 'strong',
          scores: { estimation: 2, architecture: 1, communication: 1 },
          reaction:
            'That ratio is the whole interview. So what do you index?',
          coaching:
            'Storage is easy to compute and not the constraint. Comparing write rate to read rate is the move that reframes the problem, and stating that it inverts the catalogue case shows you know why.',
          concepts: ['back-of-envelope', 'write-amplification', 'retention'],
        },
        {
          id: 'est-storage',
          text: 'Two hundred and fifty megabytes a second, around twenty terabytes a day, or six hundred terabytes over thirty days before compression.',
          quality: 'adequate',
          scores: { estimation: 1 },
          reaction: 'Correct. And how often is any of it read?',
          coaching:
            'Accurate, and it sizes the storage without telling you how to build anything. Set the write rate against the read rate and the design follows.',
          concepts: ['back-of-envelope'],
        },
        {
          id: 'est-reads',
          text: 'Two searches a second is tiny, so query capacity is not something we need to plan for.',
          quality: 'weak',
          scores: { estimation: -1, reliability: -1 },
          reaction:
            'During an outage, every engineer on call is searching at once. Is it still tiny?',
          coaching:
            'Low average query rate is true and misleading: query load spikes exactly when ingest spikes, because an incident causes both. Plan for the correlated peak, not the mean.',
          concepts: ['capacity-headroom'],
        },
      ],
    },

    {
      id: 'estimate-help',
      kind: 'estimate',
      prompt:
        'Let me narrow it. Half a million writes a second, two reads a second. Roughly what is the ratio, and which way does it point?',
      next: 'index',
      choices: [
        {
          id: 'help-good',
          text: 'About two hundred and fifty thousand writes for every read. So any work done at write time is paid a quarter of a million times and used once - I should do as little of it as I can get away with.',
          quality: 'strong',
          scores: { estimation: 2, 'trade-offs': 1 },
          reaction: 'Exactly. Keep that in your head for the next question.',
          coaching:
            'Turning the ratio into a rule - minimise write-time work - is what makes the rest of the design fall out.',
          concepts: ['write-amplification'],
        },
        {
          id: 'help-adequate',
          text: 'Heavily write-dominated - far more data goes in than anyone reads.',
          quality: 'adequate',
          scores: { estimation: 1 },
          reaction: 'Right direction. What does that say about indexing?',
          coaching:
            'The direction is right. The follow-through is that indexing is write-time work, so its cost scales with the side of the ratio you have most of.',
          concepts: ['index'],
        },
      ],
    },

    {
      id: 'index',
      kind: 'design',
      prompt: 'So what do you index, and what do you not?',
      next: 'trace',
      choices: [
        {
          id: 'index-labels',
          text: 'Only the low-cardinality structured fields: tenant, service, host, severity and time. Partition by time and pack lines into compressed blocks of a few thousand. A query for one service, one hour, errors only, prunes sixty terabytes down to a few hundred megabytes using just those labels - and a few hundred megabytes can simply be scanned. Past that point more index buys nothing and still costs the same to maintain.',
          quality: 'strong',
          scores: { architecture: 2, 'data-modelling': 2, 'trade-offs': 2 },
          reaction:
            'Good. Now someone pastes a trace id and wants every line for it across thirty days.',
          coaching:
            'An index earns its cost by pruning, and once the survivors fit in the query budget, more index is pure cost. That is why the design that looks lazy is the correct one.',
          concepts: ['index', 'cardinality', 'columnar-storage', 'time-series-storage'],
        },
        {
          id: 'index-fulltext',
          text: 'A full-text inverted index over the message body, since engineers search for strings, plus the structured fields.',
          quality: 'adequate',
          scores: { architecture: 0, 'trade-offs': -1, scalability: -1 },
          reaction:
            'That index is roughly the size of the data and is written half a million times a second. How many queries does it serve?',
          coaching:
            'Full-text search over logs works and is expensive in exactly the way the ratio predicts: it can double storage and adds index work to every write, to serve a handful of reads. Prune with labels and scan the content instead.',
          concepts: ['inverted-index', 'write-amplification'],
        },
        {
          id: 'index-everything',
          text: 'Index every field including request id and user id, so any lookup is a direct seek.',
          quality: 'weak',
          scores: { 'data-modelling': -2, scalability: -1 },
          reaction:
            'A request id appears in about five lines out of billions. How big is that index?',
          coaching:
            'A field whose cardinality approaches the number of rows produces an index nearly the size of the data. It prunes perfectly and costs everything, and it is the most common way a log cluster’s bill doubles overnight.',
          concepts: ['cardinality', 'write-amplification'],
        },
      ],
    },

    {
      id: 'trace',
      kind: 'deepen',
      prompt:
        'You declined to index request ids. An engineer has a trace id from a failing request and needs every line for it across thirty days - right now, mid-incident. How?',
      next: 'retention',
      choices: [
        {
          id: 'trace-bloom',
          text: 'A Bloom filter per block over the distinct tokens it contains. At query time I ask each block in range whether it might contain the id. The filters are a few kilobytes per block, they never give a false negative, and at a one per cent false-positive rate I scan one per cent of the corpus instead of all of it. Slower than a seek, far cheaper than an index the size of the data, and the filters are small enough to keep on fast storage for the whole window.',
          quality: 'strong',
          scores: { architecture: 2, 'trade-offs': 2, adaptability: 2 },
          reaction:
            'That is the reconciliation. Good.',
          coaching:
            'This is the round that tests adaptability: you refused an index for good reasons, and now the most valuable query needs one. A probabilistic filter keeps the refusal and answers the query - which is the kind of move the interviewer is looking for.',
          concepts: ['bloom-filter', 'read-amplification', 'correlation-id'],
        },
        {
          id: 'trace-separate',
          text: 'Write trace ids to a separate key-value store as they arrive, mapping each id to the blocks that contain it.',
          quality: 'adequate',
          scores: { architecture: 1, adaptability: 1, scalability: -1 },
          reaction:
            'That is a write per unique trace id, which is nearly one per request. Have you just rebuilt the index you rejected?',
          coaching:
            'A dedicated trace index is defensible when trace lookup is the dominant query, and it is the high-cardinality index by another name. Say so, and compare it against a filter that costs far less.',
          concepts: ['secondary-index', 'cardinality'],
        },
        {
          id: 'trace-scan',
          text: 'Scan all thirty days in parallel across the cluster until we find the matching lines.',
          quality: 'weak',
          scores: { scalability: -2, reliability: -1 },
          reaction:
            'Sixty terabytes, mid-incident, while ingest is also at its peak. What does that scan do to everything else?',
          coaching:
            'A full scan works on paper and takes the cluster down in practice, at exactly the moment you need it. Something must prune the blocks before any are read.',
          concepts: ['read-amplification', 'load-shedding'],
        },
      ],
    },

    {
      id: 'retention',
      kind: 'tradeoff',
      prompt: 'Thirty days means deleting two terabytes every day. How?',
      next: 'incident',
      choices: [
        {
          id: 'ret-drop',
          text: 'Because the partition key leads with time, retention is dropping whole partitions - an hour or a day at a time. No row is examined, no index is rewritten, nothing waits for compaction. If retention were a delete over rows, it would be the most expensive thing the system does, forever, competing with ingest.',
          quality: 'strong',
          scores: { 'data-modelling': 2, 'trade-offs': 1, reliability: 1 },
          reaction: 'Right. Partition by lifetime and deletion is free.',
          coaching:
            'The general principle: when data has a lifetime, partition by it. It is also a common reason a table that worked in its first year becomes unmanageable in its second.',
          concepts: ['retention', 'compaction', 'partition-key'],
        },
        {
          id: 'ret-ttl',
          text: 'Set a time-to-live on each document so the storage engine expires it automatically.',
          quality: 'adequate',
          scores: { 'data-modelling': 1, 'trade-offs': 0 },
          reaction:
            'In most engines an expired document becomes a tombstone that compaction reclaims later. At two terabytes a day, what is compaction doing?',
          coaching:
            'Per-document expiry is convenient and still deletion by rows underneath. Whole-partition drops avoid the tombstones and the compaction work entirely.',
          concepts: ['ttl', 'compaction', 'lsm-tree'],
        },
        {
          id: 'ret-delete',
          text: 'Run a nightly job that deletes every log line older than thirty days.',
          quality: 'weak',
          scores: { 'data-modelling': -2, reliability: -1 },
          reaction:
            'That job touches two terabytes of rows every night, and ingest does not stop while it runs. How long does it take?',
          coaching:
            'Deleting by query is the slowest possible retention: it rewrites structures, generates tombstones, and grows with the data. Make the unit of retention the unit of storage.',
          concepts: ['compaction', 'write-amplification'],
        },
      ],
    },

    {
      id: 'incident',
      kind: 'pressure',
      prompt:
        'A major incident. Log volume triples because errors log more and retries multiply requests, and every engineer is searching at once. What happens, and what did you design for it?',
      next: 'wrap',
      choices: [
        {
          id: 'inc-correlated',
          text: 'The point is that the two peaks coincide by construction - the incident causes both - so I would never let query and ingest draw from the same capacity. Separate the pools, and decide the priority in advance: ingest wins, because a missing log line is permanently missing and a slow query is just slow. At the ingest tier, shed by severity - debug before info before warnings, errors essentially never - and meter per tenant so the team causing the flood absorbs it. Agents buffer locally, so a brief refusal delays logs rather than losing them.',
          quality: 'strong',
          scores: { 'failure-handling': 2, reliability: 2, scalability: 1 },
          reaction:
            'Naming the correlation is the thing. Most designs assume those loads are independent.',
          coaching:
            'Correlated peaks are what make this system unusual, and planning for them - separate capacity, a pre-agreed priority, severity-ordered shedding - is the difference between logs that survive the incident and a post-mortem with an empty window.',
          concepts: ['bulkhead', 'load-shedding', 'backpressure', 'tenant-isolation', 'sampling'],
        },
        {
          id: 'inc-autoscale',
          text: 'Autoscale both the ingest tier and the query tier on load so each gets the capacity it needs.',
          quality: 'adequate',
          scores: { reliability: 1, 'failure-handling': 0 },
          reaction:
            'Scaling takes minutes and the incident is now. Which one do you starve if you cannot have both?',
          coaching:
            'Elastic capacity helps later. The immediate answer is a priority decided in advance, because the moment of the incident is too late to choose.',
          concepts: ['autoscaling', 'capacity-headroom'],
        },
        {
          id: 'inc-queue',
          text: 'The ingest tier queues everything it cannot process yet and works through the backlog once the incident is over.',
          quality: 'weak',
          scores: { 'failure-handling': -2, reliability: -1 },
          reaction:
            'The logs from the incident arrive an hour after it ends. What were the engineers searching?',
          coaching:
            'An unbounded internal queue converts overload into invisible lag, and the logs you most need arrive after they are useful. Refuse at the edge so agents buffer, and alert on lag rather than errors.',
          concepts: ['queue-depth', 'backpressure'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      prompt: 'Last one. How do you know this system is healthy, given that it can fail without logging an error?',
      choices: [
        {
          id: 'wrap-good',
          text: 'End-to-end ingest lag - the age of the newest searchable line per tenant - because the characteristic failure is everything succeeding slowly. The index-to-data ratio, because it jumps silently the day someone adds a high-cardinality field. Shed volume by severity, so I know what we are throwing away. And query cost by user, since one unbounded search is the usual way a shared cluster falls over.',
          quality: 'strong',
          scores: { reliability: 2, 'failure-handling': 1, communication: 2 },
          reaction: 'The index-to-data ratio is the one people never think to watch. Good.',
          coaching:
            'Every metric here watches a silent failure: lag, a growing index, deliberate data loss, and a runaway query. None of them would ever raise an error.',
          concepts: ['observability', 'alerting', 'queue-depth', 'cardinality'],
        },
        {
          id: 'wrap-adequate',
          text: 'Alert on ingest errors, query errors, and disk usage.',
          quality: 'adequate',
          scores: { reliability: 1, communication: 0 },
          reaction: 'Suppose ingest is an hour behind and nothing has errored. Would you know?',
          coaching:
            'Error rates miss the failure this system is best at, which is falling silently behind. Measure lag directly.',
          concepts: ['alerting'],
        },
      ],
    },
  ],
};
