/**
 * Estimation presets (brief section 6).
 *
 * Every number a learner sees in this curriculum is either cited, physical, or a *stated
 * assumption they can change*. These presets are the third kind: the assumptions are inputs,
 * the results recompute, and the derivation is always visible.
 *
 * The teaching point is not the arithmetic. It is: "does a 10x change in this assumption
 * change the architecture?" If not, stop estimating and move on.
 */

export interface EstimatorInput {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  /** Log slider: the range spans orders of magnitude, which is how these quantities vary. */
  log?: boolean;
  /** Why this assumption is defensible, and what would change it. */
  note?: string;
}

export interface EstimatorRow {
  label: string;
  /** Derived value from the current inputs. */
  compute: (v: Record<string, number>) => number;
  unit: string;
  /** How the number is derived, in words. Shown next to the result. */
  derivation: string;
  /** Format as bytes (KB/MB/GB/TB/PB) rather than a plain count. */
  bytes?: boolean;
  /** Highlight: this is the number that decides the architecture. */
  decisive?: boolean;
}

export interface EstimatorPreset {
  id: string;
  title: string;
  intro: string;
  inputs: EstimatorInput[];
  rows: EstimatorRow[];
  /** What the numbers mean for the design. The point of the whole exercise. */
  interpretation: { when: string; then: string }[];
}

const SECONDS_PER_DAY = 86_400;

export const ESTIMATORS: EstimatorPreset[] = [
  {
    id: 'traffic',
    title: 'Traffic: users to requests per second',
    intro:
      'The first estimate in almost every design. It converts a product number (users) into an engineering number (requests per second), and shows you the peak, which is what you actually build for.',
    inputs: [
      {
        id: 'mau',
        label: 'Monthly active users',
        value: 100_000_000,
        unit: 'users',
        min: 1_000,
        max: 5_000_000_000,
        log: true,
        note: 'Product gives you this. If nobody knows it, say what you assume and move on.',
      },
      {
        id: 'dauRatio',
        label: 'Daily actives as a share of monthly',
        value: 0.2,
        unit: 'ratio',
        min: 0.01,
        max: 1,
        note: 'A messaging app sits high; a tax-filing app sits very low. 10-30% is a common band for consumer social products.',
      },
      {
        id: 'actionsPerDau',
        label: 'Actions per active user per day',
        value: 20,
        unit: 'actions',
        min: 1,
        max: 2_000,
        log: true,
        note: 'Count only actions that reach your servers. Scrolling a cached feed may be one request or fifty.',
      },
      {
        id: 'peakFactor',
        label: 'Peak-to-average ratio',
        value: 3,
        unit: 'x',
        min: 1,
        max: 50,
        log: true,
        note: 'Traffic is never flat. Regional concentration gives 2-4x; a scheduled event or a push notification gives 10x or more within seconds.',
      },
      {
        id: 'readWrite',
        label: 'Reads per write',
        value: 100,
        unit: ':1',
        min: 0.1,
        max: 100_000,
        log: true,
        note: 'The single most design-shaping ratio. It decides whether you cache, replicate, or shard first.',
      },
    ],
    rows: [
      {
        label: 'Daily active users',
        compute: (v) => v.mau! * v.dauRatio!,
        unit: 'users',
        derivation: 'MAU x DAU ratio',
      },
      {
        label: 'Requests per day',
        compute: (v) => v.mau! * v.dauRatio! * v.actionsPerDau!,
        unit: 'requests',
        derivation: 'DAU x actions per user',
      },
      {
        label: 'Average requests per second',
        compute: (v) => (v.mau! * v.dauRatio! * v.actionsPerDau!) / SECONDS_PER_DAY,
        unit: 'rps',
        derivation: 'requests per day / 86,400',
      },
      {
        label: 'Peak requests per second',
        compute: (v) =>
          ((v.mau! * v.dauRatio! * v.actionsPerDau!) / SECONDS_PER_DAY) * v.peakFactor!,
        unit: 'rps',
        derivation: 'average rps x peak factor',
        decisive: true,
      },
      {
        label: 'Peak writes per second',
        compute: (v) =>
          (((v.mau! * v.dauRatio! * v.actionsPerDau!) / SECONDS_PER_DAY) * v.peakFactor!) /
          (1 + v.readWrite!),
        unit: 'wps',
        derivation: 'peak rps / (1 + reads per write)',
        decisive: true,
      },
      {
        label: 'Peak reads per second',
        compute: (v) =>
          ((((v.mau! * v.dauRatio! * v.actionsPerDau!) / SECONDS_PER_DAY) * v.peakFactor!) /
            (1 + v.readWrite!)) *
          v.readWrite!,
        unit: 'rps',
        derivation: 'peak writes x reads per write',
      },
    ],
    interpretation: [
      {
        when: 'Peak writes are below a few thousand per second',
        then: 'A single well-tuned relational primary can absorb this. Do not shard. Spend the effort on indexes and connection management.',
      },
      {
        when: 'Peak reads are 100x writes or more',
        then: 'Caching and read replicas are the highest-leverage moves. Sharding solves a problem you do not have.',
      },
      {
        when: 'Peak writes exceed roughly tens of thousands per second sustained',
        then: 'A single leader stops being viable. Now partitioning is the conversation, and you need a partition key that spreads the load.',
      },
      {
        when: 'The peak factor is above 10',
        then: 'Autoscaling cannot react fast enough. You need standing headroom, queues to absorb the burst, and load shedding for the part you cannot absorb.',
      },
    ],
  },

  {
    id: 'storage',
    title: 'Storage: how much data, and for how long',
    intro:
      'Storage estimates are where architectures are decided quietly. The question is not "how big is the database" but "does the working set fit in memory, and does the total fit on one machine".',
    inputs: [
      {
        id: 'writesPerDay',
        label: 'Writes per day',
        value: 100_000_000,
        unit: 'writes',
        min: 1_000,
        max: 100_000_000_000,
        log: true,
      },
      {
        id: 'bytesPerRecord',
        label: 'Bytes per record',
        value: 1_000,
        unit: 'bytes',
        min: 10,
        max: 10_000_000,
        log: true,
        note: 'Include the indexes. A 200-byte row with four indexes often costs a kilobyte on disk.',
      },
      {
        id: 'replicationFactor',
        label: 'Replication factor',
        value: 3,
        unit: 'copies',
        min: 1,
        max: 9,
        note: 'Three is the usual answer: survive one failure while another node is being replaced.',
      },
      {
        id: 'retentionDays',
        label: 'Retention',
        value: 365,
        unit: 'days',
        min: 1,
        max: 3_650,
        log: true,
        note: 'Retention is a product and legal decision that engineers usually inherit without being asked.',
      },
      {
        id: 'hotFraction',
        label: 'Share of data that is actually read',
        value: 0.05,
        unit: 'ratio',
        min: 0.0001,
        max: 1,
        log: true,
        note: 'Access is almost always heavily skewed toward recent data. This is what decides your cache size.',
      },
    ],
    rows: [
      {
        label: 'New data per day',
        compute: (v) => v.writesPerDay! * v.bytesPerRecord!,
        unit: '',
        bytes: true,
        derivation: 'writes per day x bytes per record',
      },
      {
        label: 'Logical data at full retention',
        compute: (v) => v.writesPerDay! * v.bytesPerRecord! * v.retentionDays!,
        unit: '',
        bytes: true,
        derivation: 'daily data x retention',
      },
      {
        label: 'Physical data including replicas',
        compute: (v) =>
          v.writesPerDay! * v.bytesPerRecord! * v.retentionDays! * v.replicationFactor!,
        unit: '',
        bytes: true,
        derivation: 'logical data x replication factor',
        decisive: true,
      },
      {
        label: 'Working set (what must be fast)',
        compute: (v) =>
          v.writesPerDay! * v.bytesPerRecord! * v.retentionDays! * v.hotFraction!,
        unit: '',
        bytes: true,
        derivation: 'logical data x hot share',
        decisive: true,
      },
      {
        label: 'Storage cost per month, rough',
        compute: (v) =>
          (v.writesPerDay! * v.bytesPerRecord! * v.retentionDays! * v.replicationFactor! * 0.023) /
          1e9,
        unit: 'USD/month',
        derivation:
          'physical bytes x an assumed 0.023 USD per GB-month. Substitute your provider’s actual figure; this is an order-of-magnitude placeholder, not a quote.',
      },
    ],
    interpretation: [
      {
        when: 'The working set fits comfortably in one machine’s RAM',
        then: 'You do not need a separate cache tier yet. The database page cache is already the cache, and adding Redis buys staleness for nothing.',
      },
      {
        when: 'Physical data exceeds what one machine can hold',
        then: 'You are now sharding whether you like it or not. Choose the partition key before you write the schema, because changing it later is a migration project.',
      },
      {
        when: 'Storage cost is dominated by data older than 30 days',
        then: 'The design question is tiering and retention, not databases. Cold data belongs in object storage with a slower read path.',
      },
    ],
  },

  {
    id: 'availability',
    title: 'Availability: what the nines actually cost you',
    intro:
      'Availability arithmetic is unforgiving in one direction and generous in the other: dependencies in series multiply, redundancy in parallel multiplies the failure probability instead.',
    inputs: [
      {
        id: 'componentAvailability',
        label: 'Availability of one component',
        value: 0.999,
        unit: 'fraction',
        min: 0.9,
        max: 0.99999,
        note: 'A well-run managed service is often quoted around three nines. Your own service is usually worse than you think.',
      },
      {
        id: 'seriesCount',
        label: 'Components in the request path',
        value: 5,
        unit: 'components',
        min: 1,
        max: 40,
        note: 'Count every hop a request must succeed at: load balancer, service, cache, database, plus each synchronous dependency.',
      },
      {
        id: 'redundancy',
        label: 'Independent redundant copies of each',
        value: 1,
        unit: 'copies',
        min: 1,
        max: 5,
        note: 'Only counts if the copies fail independently. Two instances in one rack are one failure domain.',
      },
    ],
    rows: [
      {
        label: 'Availability of one redundant group',
        compute: (v) => 1 - Math.pow(1 - v.componentAvailability!, v.redundancy!),
        unit: 'fraction',
        derivation: '1 - (1 - component availability) ^ redundancy',
      },
      {
        label: 'End-to-end availability',
        compute: (v) =>
          Math.pow(1 - Math.pow(1 - v.componentAvailability!, v.redundancy!), v.seriesCount!),
        unit: 'fraction',
        derivation: 'group availability ^ number of components in series',
        decisive: true,
      },
      {
        label: 'Downtime per year',
        compute: (v) =>
          (1 -
            Math.pow(1 - Math.pow(1 - v.componentAvailability!, v.redundancy!), v.seriesCount!)) *
          365 *
          24 *
          60,
        unit: 'minutes',
        derivation: '(1 - availability) x minutes in a year',
        decisive: true,
      },
      {
        label: 'Error budget per 30 days',
        compute: (v) =>
          (1 -
            Math.pow(1 - Math.pow(1 - v.componentAvailability!, v.redundancy!), v.seriesCount!)) *
          30 *
          24 *
          60,
        unit: 'minutes',
        derivation: '(1 - availability) x minutes in 30 days',
      },
    ],
    interpretation: [
      {
        when: 'Adding one more synchronous dependency',
        then: 'You multiply your availability by that dependency’s. Five three-nines components in series give roughly 99.5%, which is over 40 hours of downtime a year.',
      },
      {
        when: 'A dependency is not essential to the response',
        then: 'Make the call asynchronous or degrade gracefully without it. Removing something from the critical path is usually cheaper than making it more reliable.',
      },
      {
        when: 'Your target needs more nines than arithmetic allows',
        then: 'The answer is fewer components in the path, not better components. Redundancy only helps if failures are genuinely independent.',
      },
    ],
  },

  {
    id: 'cache',
    title: 'Caching: what a hit rate is actually worth',
    intro:
      'A cache is a bet. This shows the payoff, and, more importantly, what happens to the origin when the bet stops paying.',
    inputs: [
      {
        id: 'peakRps',
        label: 'Peak requests per second',
        value: 50_000,
        unit: 'rps',
        min: 10,
        max: 10_000_000,
        log: true,
      },
      {
        id: 'hitRate',
        label: 'Cache hit rate',
        value: 0.95,
        unit: 'fraction',
        min: 0,
        max: 0.9999,
        note: 'Measured, not hoped for. Hit rate collapses non-linearly once the hot set stops fitting.',
      },
      {
        id: 'originCapacity',
        label: 'Origin capacity',
        value: 5_000,
        unit: 'rps',
        min: 10,
        max: 1_000_000,
        log: true,
        note: 'What the database can actually serve at acceptable latency, not its theoretical maximum.',
      },
      {
        id: 'cacheLatency',
        label: 'Cache latency',
        value: 1,
        unit: 'ms',
        min: 0.05,
        max: 50,
        log: true,
      },
      {
        id: 'originLatency',
        label: 'Origin latency',
        value: 25,
        unit: 'ms',
        min: 1,
        max: 5_000,
        log: true,
      },
    ],
    rows: [
      {
        label: 'Requests reaching the origin',
        compute: (v) => v.peakRps! * (1 - v.hitRate!),
        unit: 'rps',
        derivation: 'peak rps x (1 - hit rate)',
        decisive: true,
      },
      {
        label: 'Origin utilisation',
        compute: (v) => (v.peakRps! * (1 - v.hitRate!)) / v.originCapacity!,
        unit: 'fraction of capacity',
        derivation: 'origin rps / origin capacity',
        decisive: true,
      },
      {
        label: 'Average latency',
        compute: (v) => v.hitRate! * v.cacheLatency! + (1 - v.hitRate!) * v.originLatency!,
        unit: 'ms',
        derivation: 'hit rate x cache latency + miss rate x origin latency',
      },
      {
        label: 'Origin load if the cache is empty',
        compute: (v) => v.peakRps!,
        unit: 'rps',
        derivation: 'every request becomes a miss',
        decisive: true,
      },
      {
        label: 'Overload factor on a cold cache',
        compute: (v) => v.peakRps! / v.originCapacity!,
        unit: 'x capacity',
        derivation: 'peak rps / origin capacity',
        decisive: true,
      },
    ],
    interpretation: [
      {
        when: 'The cold-cache overload factor is above 1',
        then: 'A cache restart, a deploy, or an eviction storm takes the origin down. You need request coalescing, staggered TTLs, and load shedding before you need a bigger cache.',
      },
      {
        when: 'Hit rate drops from 95% to 90%',
        then: 'Origin load doubles. Hit rate is not a linear dial; small degradations produce large origin swings.',
      },
      {
        when: 'Average latency barely improves',
        then: 'The cache is not solving a latency problem. Check whether it is solving a capacity problem instead, and whether an index would be cheaper than both.',
      },
    ],
  },
];

export const ESTIMATOR_BY_ID: Record<string, EstimatorPreset> = Object.fromEntries(
  ESTIMATORS.map((e) => [e.id, e]),
);
