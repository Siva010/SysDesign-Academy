import type { Scenario } from './types';

/**
 * The interview where the dangerous number is not the one anybody quotes.
 *
 * Volume is easy to reason about and it is not what kills a metrics platform. Cardinality is,
 * and it arrives from a one-line code change in someone else's service. The scenario also
 * probes the property that makes this system unusual: its load rises during its own incidents.
 */
export const METRICS: Scenario = {
  id: 'metrics',
  title: 'Design a metrics platform',
  opening:
    'Design a system that collects metrics from our fleet and answers dashboard and alerting queries over them.',
  difficulty: 'advanced',
  minutes: 40,
  caseStudyId: 'metrics-platform',
  assesses: [
    'requirements',
    'estimation',
    'architecture',
    'data-modelling',
    'scalability',
    'reliability',
    'failure-handling',
    'trade-offs',
    'adaptability',
  ],
  startPhase: 'open',
  phases: [
    {
      id: 'open',
      kind: 'clarify',
      prompt:
        'Design a system that collects metrics from our fleet and answers dashboard and alerting queries over them.',
      note: 'Assume a hundred thousand hosts. The interesting constraint is not the one that number suggests.',
      next: 'estimate',
      choices: [
        {
          id: 'clarify-cardinality',
          text: 'The first thing I want to establish is who controls label values, because series count is the product of the distinct values of every label. If any label can carry a user id or a request id, cardinality is unbounded and that is a much harder problem than volume. I also want the resolution and retention, and whether we are storing histograms, since a histogram is a dozen series wearing one name.',
          quality: 'strong',
          scores: { requirements: 2, 'data-modelling': 2, communication: 1 },
          reaction:
            'Engineers choose labels and nothing validates them. Ten-second resolution, thirteen months with rollups, and yes, histograms. You have found the thing I care about.',
          coaching:
            'Asking about cardinality before volume is the signal that separates people who have run one of these from people who have read about one. Volume is a capacity problem with a known answer; cardinality is a correctness-of-design problem that one careless line of code can create.',
          concepts: ['cardinality', 'requirement-clarification', 'time-series-storage'],
        },
        {
          id: 'clarify-volume',
          text: 'How many metrics per host, at what resolution, and how long do we keep them?',
          quality: 'adequate',
          scores: { requirements: 1 },
          reaction:
            'About five hundred series per host, every ten seconds, kept for thirteen months. Anything else you want to know about those series?',
          coaching:
            'The right questions for sizing, and they stop short of the one that decides the design. Ask who chooses the label values — that is where unbounded growth comes from, and no amount of capacity planning survives it.',
          concepts: ['requirement-clarification', 'back-of-envelope'],
        },
        {
          id: 'clarify-none',
          text: 'I would use a time-series database, write to it from an agent on each host, and query it from a dashboard.',
          quality: 'weak',
          scores: { requirements: -2, architecture: -1 },
          reaction:
            'That is roughly the right shape. Someone adds a label containing the request id. What happens to your time-series database?',
          coaching:
            'Naming the component category is not a design. The question is what the system does when it is used badly by well-meaning engineers, and that scenario should be raised by you rather than by the interviewer.',
        },
      ],
    },

    {
      id: 'estimate',
      kind: 'estimate',
      prompt:
        'A hundred thousand hosts, five hundred series each, one sample every ten seconds. Give me the numbers.',
      next: 'ingest',
      nextIfWeak: 'estimate-help',
      choices: [
        {
          id: 'est-good',
          text: 'Fifty million active series, and at ten-second resolution that is five million samples per second. A naive sixteen-byte sample gives about seven terabytes a day, which is untenable — but timestamps in a series are regularly spaced and values change slowly, so delta and XOR encoding get it to roughly one to two bytes amortised, which is about 650 gigabytes a day. That tenfold difference is not a tuning detail; it is the difference between affordable and not. Separately, the series index is only about ten gigabytes but must be searchable by arbitrary label combinations, and that is where the hard queries land.',
          quality: 'strong',
          scores: { estimation: 2, 'data-modelling': 2, architecture: 1 },
          reaction:
            'Good — especially separating the index from the samples. Which of those two do you think fails first?',
          coaching:
            'Estimating both the sample volume and the index size, and noting that the small one is the hard one, is the reasoning this question exists to test. Most candidates size the bytes and never mention the index at all.',
          concepts: ['back-of-envelope', 'time-series-storage', 'cardinality'],
        },
        {
          id: 'est-partial',
          text: 'Fifty million series and five million samples per second. That is a lot of writes, so we need a store built for high-volume appends.',
          quality: 'adequate',
          scores: { estimation: 1 },
          reaction:
            'Right on the volume. What does a sample cost in bytes, and does that number change what you would build?',
          coaching:
            'The rate is correct. Sample encoding is worth carrying through, because sixteen bytes and one and a half bytes lead to different hardware, different retention policies and a different bill by an order of magnitude.',
          concepts: ['back-of-envelope'],
        },
        {
          id: 'est-vague',
          text: 'It is a very high write rate — millions of points per second — so this needs a purpose-built time-series store rather than a relational database.',
          quality: 'weak',
          scores: { estimation: -1 },
          reaction:
            'Agreed, and I would still like the arithmetic. How much data per day, and how much at thirteen months?',
          coaching:
            'The conclusion is right and unsupported. Retention cost is the largest line item in this system, and you cannot discuss retention tiers without the daily figure.',
        },
      ],
    },

    {
      id: 'estimate-help',
      kind: 'estimate',
      prompt:
        'Let me help with the shape. Fifty million series at one sample per ten seconds. Samples per second, and bytes per day at two bytes a sample?',
      next: 'ingest',
      choices: [
        {
          id: 'help-good',
          text: 'Five million samples per second, so about 432 billion a day. At two bytes that is roughly 860 gigabytes a day, and thirteen months of that unrolled would be hundreds of terabytes — which is why rollups and retention tiers are not optional.',
          quality: 'strong',
          scores: { estimation: 1, adaptability: 1 },
          reaction: 'Good. So retention is a design input, not a policy you inherit later.',
          coaching:
            'Following the arithmetic through to its architectural consequence — that rollups are mandatory rather than an optimisation — is what makes an estimate useful.',
          concepts: ['back-of-envelope', 'downsampling', 'retention'],
        },
        {
          id: 'help-weak',
          text: 'About five million per second, and a lot of data per day.',
          quality: 'adequate',
          scores: { estimation: 0 },
          reaction: 'How much is a lot? Retention will be your biggest cost, so the number matters.',
          coaching:
            'The rate is the harder half and you have it. Multiply through to a daily figure, because that is the number the retention conversation is actually about.',
        },
      ],
    },

    {
      id: 'ingest',
      kind: 'design',
      prompt: 'Sketch the write path. Agents on a hundred thousand hosts, storage at the other end.',
      next: 'cardinality',
      nextIfStrong: 'incident-load',
      choices: [
        {
          id: 'ingest-log',
          text: 'Agents push to an ingest gateway that enforces per-tenant quotas and cardinality limits, and the gateway writes to a durable partitioned log rather than straight to storage. Writers consume the log into storage. That way a storage outage becomes consumer lag instead of data loss, and ingest latency is decoupled from storage latency. The log retention is then an explicit statement of how long a storage outage we can survive, and I would write that number down. Partitioning is by series hash and time window — hash so writes spread evenly, time window so retention is a partition drop rather than a delete.',
          quality: 'strong',
          scores: { architecture: 2, 'data-modelling': 2, reliability: 2 },
          reaction:
            'Good. Why not partition by time alone? It would make retention and range queries trivial.',
          coaching:
            'Two strong moves here: the buffer that converts an outage into lag, and the partition key that makes retention cheap. Stating the log retention as a survivable-outage duration turns a storage setting into a decision someone can agree to.',
          concepts: ['log-based-messaging', 'backpressure', 'partition-key', 'retention'],
        },
        {
          id: 'ingest-direct',
          text: 'Agents write directly to the storage tier, which is sharded by series hash. If a write fails, the agent retries with backoff.',
          quality: 'adequate',
          scores: { architecture: 1 },
          reaction:
            'Storage is unavailable for twenty minutes. Where does twenty minutes of samples live in the meantime?',
          coaching:
            'Agents run on the machines being monitored, so buffering in the agent means consuming memory on the hosts you are trying to observe. A monitoring agent that grows until the host dies has caused the outage it exists to report.',
          concepts: ['retry', 'backpressure'],
        },
        {
          id: 'ingest-time',
          text: 'Partition by time so all writes for the current window are together, which makes retention a simple drop and range queries fast.',
          quality: 'weak',
          scores: { 'data-modelling': -2, scalability: -1 },
          reaction:
            'Every write in the system has the current timestamp. Which partition are they all going to?',
          coaching:
            'Time alone is a monotonically increasing key, so every write targets one partition while the rest hold history and take nothing. Compose the key: hash for spread, time window for cheap retention. That gets both properties.',
          concepts: ['hot-partition', 'partition-key'],
        },
      ],
    },

    {
      id: 'cardinality',
      kind: 'pressure',
      prompt:
        'An engineer adds a label containing the request id. Series count goes from fifty million to five billion. What happens, and what should have prevented it?',
      next: 'incident-load',
      choices: [
        {
          id: 'card-budget',
          text: 'The index stops fitting in memory, every label lookup slows, and the platform degrades for every team at once — while ingest volume looks completely normal, which is what makes it hard to diagnose. The prevention is a per-tenant and per-metric series budget enforced at the ingest edge. Two details matter: it has to be at the edge, because once the sample reaches storage the index entry is already written; and the correct failure is to reject new series while continuing to serve existing ones, attributed to the metric and the owning team. Rejecting one team is a small attributable problem; accepting and degrading is a large diffuse one nobody owns.',
          quality: 'strong',
          scores: { scalability: 2, 'failure-handling': 2, 'trade-offs': 2 },
          reaction:
            'That is the answer. What is the cost of that budget on a normal day?',
          coaching:
            'Naming the symptom precisely — normal volume, degraded everything — is what makes this diagnosable. And choosing refusal over degradation is the judgment call: it converts an unattributable platform-wide failure into one team getting an error message.',
          concepts: ['cardinality', 'load-shedding', 'tenant-isolation', 'rate-limiting'],
        },
        {
          id: 'card-detect',
          text: 'We would detect the spike in series count and alert, then ask the team to remove the label.',
          quality: 'adequate',
          scores: { scalability: 1, 'failure-handling': 0 },
          reaction:
            'Detection takes minutes and a rollback takes longer. What is the platform doing for everyone else in the meantime?',
          coaching:
            'Detection is necessary and it is not a control. By the time an alert fires, the index entries exist and the damage is done, and removing the label does not remove them. The limit has to reject at ingest.',
          concepts: ['alerting', 'cardinality'],
        },
        {
          id: 'card-scale',
          text: 'Scale the storage tier so it can hold the larger index.',
          quality: 'weak',
          scores: { scalability: -2, 'trade-offs': -1 },
          reaction:
            'This time it was a request id, so the series count is unbounded. How much do you scale to?',
          coaching:
            'Unbounded cardinality cannot be absorbed by capacity, because a label with one distinct value per request has no ceiling. The only workable answer is a limit, and it has to be enforced before the index is written.',
        },
      ],
    },

    {
      id: 'incident-load',
      kind: 'pressure',
      prompt:
        'During a major incident, ingest volume rises about forty percent. Why, and what does that mean for capacity planning?',
      next: 'rollup',
      choices: [
        {
          id: 'load-correlated',
          text: 'Because our load is correlated with our own failure: errors emit metrics, retries emit metrics, and autoscaling adds hosts that each emit a full series set. So headroom measured against the median hour is not headroom — capacity has to be planned against incident load, which means running well below capacity at the median. It also means shedding has to be ordered and decided in advance: drop debug and very high cardinality series first, then dashboard-only series, and protect the series that alerting depends on. That last part requires the platform to know which series alert rules reference, which is a real coupling worth building deliberately.',
          quality: 'strong',
          scores: { reliability: 2, 'trade-offs': 2, architecture: 1 },
          reaction:
            'The coupling to the alerting configuration is the part people miss. Why does it matter so much?',
          coaching:
            'This is the defining property of an observability system and it changes capacity planning, shedding policy and the definition of headroom. Without knowing which series alerts depend on, uniform shedding drops the series that pages someone with exactly the same probability as one nobody has read in a year.',
          concepts: ['load-shedding', 'graceful-degradation', 'capacity-headroom', 'cascading-failure'],
        },
        {
          id: 'load-autoscale',
          text: 'More errors mean more log and metric emission. We would autoscale the ingest tier to absorb it.',
          quality: 'adequate',
          scores: { reliability: 1, scalability: 1 },
          reaction:
            'Autoscaling helps if there is capacity to acquire and time to acquire it. What is your shedding order if there is not?',
          coaching:
            'The cause is identified correctly. The missing half is what happens in the minutes before extra capacity arrives, which is exactly the window where the data matters most.',
          concepts: ['autoscaling', 'elasticity'],
        },
        {
          id: 'load-normal',
          text: 'Forty percent above normal is within the headroom we would normally provision, so it should be absorbed.',
          quality: 'weak',
          scores: { reliability: -2 },
          reaction:
            'Headroom above which number — the median hour, or the worst hour? Those differ by more than forty percent.',
          coaching:
            'Treating incident load as a variation rather than as a structural property leads to sizing against the quiet baseline. In this system the peak is not random: it coincides with the moments the platform is most needed.',
        },
      ],
    },

    {
      id: 'rollup',
      kind: 'deepen',
      prompt:
        'A thirty-day latency dashboard is timing out. You add rollups. What must you be careful about?',
      next: 'wrap',
      choices: [
        {
          id: 'rollup-hist',
          text: 'That you cannot average percentiles. Rolling up a mean is a weighted mean and rolling up a max is a max, but a p99 is not any function of the p99s you started with — two buckets each with one slow request out of a hundred have a p99 near the fast value, while the merged two hundred requests contain two slow ones and a genuinely slow p99. Averaging always errs toward saying the system is healthy. So latency has to be stored as histogram bucket counts, rolled up by adding buckets, with the quantile computed at query time. A platform that stores precomputed quantiles has made accurate long-range latency analysis impossible, and no query-side cleverness recovers it.',
          quality: 'strong',
          scores: { 'data-modelling': 2, 'trade-offs': 2, communication: 1 },
          reaction:
            'Correct, including the direction of the error. Anything else about rollups?',
          coaching:
            'This is the highest-value detail in the whole design, because it is irreversible: once quantiles are stored instead of buckets, the information needed to compute a correct one is gone. The bias direction matters too — the error hides problems rather than inventing them.',
          concepts: ['downsampling', 'percentiles', 'coordinated-omission'],
        },
        {
          id: 'rollup-drift',
          text: 'That rollups are derived data and can drift, so they must be rebuildable from raw samples and the rebuild must be tested.',
          quality: 'adequate',
          scores: { 'data-modelling': 1, reliability: 1 },
          reaction:
            'True and important. There is also something specific about latency metrics — what is it?',
          coaching:
            'Rebuildability is a real requirement for any derived data. The latency-specific trap is that quantiles cannot be aggregated at all, which is a correctness problem rather than a drift problem.',
          concepts: ['downsampling', 'backfill'],
        },
        {
          id: 'rollup-none',
          text: 'That the rollup interval should be chosen so the dashboard has enough points to render smoothly.',
          quality: 'weak',
          scores: { 'data-modelling': -1 },
          reaction:
            'Resolution is a fine consideration. Is a rolled-up p99 the same number as the p99 of the underlying data?',
          coaching:
            'Choosing resolution is the easy part. Aggregating quantiles by averaging is silently wrong and consistently optimistic, which is the failure mode you least want in a latency dashboard.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      prompt:
        'Final question. Ingest stops completely at 02:00. Every dashboard shows a flat line. Which alert fires?',
      choices: [
        {
          id: 'wrap-watchdog',
          text: 'None of them, and that is the problem — a total ingest failure looks exactly like a quiet night, because threshold alerts need data to breach a threshold and no data arrives. The platform cannot be its own monitoring. It needs a small independent watchdog on separate infrastructure with a separate alert delivery path, that writes a synthetic series and reads it back, and answers only whether ingest is accepting and query is answering. Anything more sophisticated becomes a second platform that also needs monitoring. And the corollary: nothing on the serving path may hard-depend on the metrics platform, or an observability outage becomes a product outage.',
          quality: 'strong',
          scores: { reliability: 2, 'failure-handling': 2, communication: 2 },
          reaction:
            'That is exactly right, including the prohibition at the end. Most candidates stop at "add an alert".',
          coaching:
            'The circular dependency is the defining reliability question for an observability system, and the strong answer names both halves: an independent liveness check, and a rule that nothing in the product may depend on the platform. Alerting on absence rather than only on thresholds is the specific technique.',
          concepts: ['alerting', 'golden-signals', 'blast-radius', 'health-check'],
        },
        {
          id: 'wrap-absence',
          text: 'We would need an alert on data absence rather than on thresholds — a rule that fires when a series stops reporting.',
          quality: 'adequate',
          scores: { reliability: 1, 'failure-handling': 1 },
          reaction:
            'Where does that rule run, and what evaluates it if the platform is down?',
          coaching:
            'Absence alerting is the right technique and it is evaluated by the platform that has stopped working. The missing piece is independence: the check must live on infrastructure that does not share the failure.',
          concepts: ['alerting', 'health-check'],
        },
        {
          id: 'wrap-weak',
          text: 'The on-call engineer would notice the dashboards were empty.',
          quality: 'weak',
          scores: { reliability: -2, 'failure-handling': -2 },
          reaction: 'At two in the morning, who is looking at a dashboard?',
          coaching:
            'Relying on a human to notice an absence is not a detection mechanism, and it is least likely to work at exactly the hours when incidents are least likely to be noticed by anyone else either.',
        },
      ],
    },
  ],
};
