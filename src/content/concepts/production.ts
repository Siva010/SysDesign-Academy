import type { Concept } from '@/lib/types';

/** Clusters: reliability, operations (including caching, observability, security, cost). */
export const PRODUCTION_CONCEPTS: Concept[] = [
  /* ============================================================ caching (reliability-adjacent) */
  {
    id: 'cache-generic',
    name: 'Caching',
    aliases: ['cache', 'memoization', 'speed up reads'],
    oneLiner:
      'Keeping an answer near where it is needed. Always a bet that the world changes slower than you read it.',
    cluster: 'reliability',
    requires: ['latency'],
    leadsTo: ['cache-aside', 'ttl', 'cache-invalidation', 'distributed-cache'],
    tensionWith: ['consistency-generic'],
    myth: 'Add a cache to make the system faster.',
    mythCorrection:
      'A cache makes reads faster and the system harder: it adds staleness, a new failure mode, a stampede risk, and a cold-start problem. The right first question is whether the read can be made cheap instead.',
  },
  {
    id: 'cache-aside',
    name: 'Cache-aside',
    aliases: ['lazy loading'],
    oneLiner: 'Application checks the cache, misses, loads from the store, and populates. Simple and explicit.',
    cluster: 'reliability',
    requires: ['cache-generic'],
    leadsTo: ['cache-stampede', 'cache-invalidation'],
  },
  {
    id: 'write-through',
    name: 'Write-through and write-back',
    oneLiner:
      'Write to the cache and the store together, or write to the cache and flush later and risk losing it.',
    cluster: 'reliability',
    requires: ['cache-generic'],
    tensionWith: ['durability'],
  },
  {
    id: 'ttl',
    name: 'TTL',
    oneLiner:
      'The simplest invalidation policy: an explicit staleness budget. Usually the right one.',
    cluster: 'reliability',
    requires: ['cache-generic', 'staleness'],
    leadsTo: ['cache-stampede'],
  },
  {
    id: 'cache-invalidation',
    name: 'Cache invalidation',
    oneLiner:
      'Deciding when a cached answer stopped being true. Hard because the cache does not know what changed.',
    cluster: 'reliability',
    requires: ['cache-generic'],
    leadsTo: ['ttl', 'cdc'],
    tensionWith: ['consistency-generic'],
  },
  {
    id: 'eviction',
    name: 'Eviction',
    oneLiner: 'What gets thrown out when the cache is full: LRU, LFU, or random, and each has a pathology.',
    cluster: 'reliability',
    requires: ['cache-generic'],
    leadsTo: ['hit-rate'],
  },
  {
    id: 'hit-rate',
    name: 'Hit rate and the working set',
    oneLiner:
      'A cache only helps if the hot set fits. Below that threshold, hit rate collapses non-linearly.',
    cluster: 'reliability',
    requires: ['eviction'],
    leadsTo: ['capacity-planning'],
  },
  {
    id: 'distributed-cache',
    name: 'Distributed cache',
    oneLiner:
      'A shared cache tier so every app server sees the same entries, at the cost of a network hop and a new dependency.',
    cluster: 'reliability',
    requires: ['cache-generic', 'partitioning'],
    leadsTo: ['local-cache', 'hot-key'],
  },
  {
    id: 'local-cache',
    name: 'Local (in-process) cache',
    oneLiner:
      'The fastest cache there is, and the one that guarantees your servers disagree with each other.',
    cluster: 'reliability',
    requires: ['cache-generic'],
    tensionWith: ['consistency-generic', 'distributed-cache'],
  },
  {
    id: 'cache-stampede',
    name: 'Cache stampede',
    aliases: ['dogpile', 'thundering herd on miss'],
    oneLiner:
      'A popular key expires and every concurrent request goes to the origin at once, often taking it down.',
    cluster: 'reliability',
    requires: ['ttl', 'cache-aside'],
    leadsTo: ['request-coalescing', 'thundering-herd'],
  },
  {
    id: 'request-coalescing',
    name: 'Request coalescing',
    aliases: ['single flight', 'lock on miss'],
    oneLiner: 'Let one request rebuild the value while the others wait for it, instead of all rebuilding it.',
    cluster: 'reliability',
    requires: ['cache-stampede'],
  },
  {
    id: 'cache-penetration',
    name: 'Cache penetration',
    oneLiner:
      'Requests for keys that do not exist bypass the cache every time. Fixed by caching the absence.',
    cluster: 'reliability',
    requires: ['cache-aside'],
    leadsTo: ['bloom-filter'],
  },

  /* ============================================================ reliability */
  {
    id: 'sli',
    name: 'SLI',
    oneLiner: 'A measurement of something a user actually feels: success rate, latency, freshness.',
    cluster: 'reliability',
    requires: ['percentiles'],
    leadsTo: ['slo'],
  },
  {
    id: 'slo',
    name: 'SLO',
    oneLiner: 'The target for an SLI, chosen deliberately below 100% because perfection has no budget.',
    cluster: 'reliability',
    requires: ['sli'],
    leadsTo: ['error-budget', 'sla', 'alerting'],
  },
  {
    id: 'sla',
    name: 'SLA',
    oneLiner: 'The contractual promise, with money attached. Always looser than the internal SLO.',
    cluster: 'reliability',
    requires: ['slo'],
  },
  {
    id: 'error-budget',
    name: 'Error budget',
    oneLiner:
      'The allowed unreliability. Spend it on shipping; when it is gone, stop shipping and fix things.',
    cluster: 'reliability',
    requires: ['slo', 'availability-math'],
    leadsTo: ['alerting'],
  },
  {
    id: 'redundancy',
    name: 'Redundancy',
    oneLiner: 'More than one of everything, arranged so that they do not fail for the same reason.',
    cluster: 'reliability',
    requires: ['availability-math'],
    leadsTo: ['fault-domain', 'failover'],
    tensionWith: ['cost'],
  },
  {
    id: 'fault-domain',
    name: 'Fault domain',
    aliases: ['availability zone', 'failure domain'],
    oneLiner: 'A boundary within which things fail together. Redundancy only counts across domains.',
    cluster: 'reliability',
    requires: ['redundancy'],
    leadsTo: ['multi-az', 'blast-radius'],
  },
  {
    id: 'blast-radius',
    name: 'Blast radius',
    oneLiner: 'How much of the system one failure, or one bad deploy, can take with it.',
    cluster: 'reliability',
    requires: ['fault-domain'],
    leadsTo: ['bulkhead', 'canary', 'cell-architecture'],
  },
  {
    id: 'cell-architecture',
    name: 'Cell-based architecture',
    aliases: ['shuffle sharding', 'cells'],
    oneLiner:
      'Divide the fleet into independent cells so a failure or a bad tenant affects one cell, not everyone.',
    cluster: 'reliability',
    requires: ['blast-radius', 'bulkhead'],
    leadsTo: ['tenant-isolation'],
  },
  {
    id: 'timeout',
    name: 'Timeout',
    oneLiner:
      'The decision to stop waiting. Without one, a slow dependency consumes every thread you have.',
    cluster: 'reliability',
    requires: ['failure-detector', 'latency-budget'],
    leadsTo: ['retry', 'cascading-failure'],
    myth: 'A generous timeout is safer than a tight one.',
    mythCorrection:
      'A timeout longer than the caller is willing to wait is not a timeout, it is a resource leak. Timeouts should be derived from the latency budget, not from the dependency latency.',
  },
  {
    id: 'retry',
    name: 'Retry',
    oneLiner: 'Try again, because many failures are transient. Also the fastest way to turn a blip into an outage.',
    cluster: 'reliability',
    requires: ['timeout', 'idempotency'],
    leadsTo: ['retry-amplification', 'exponential-backoff', 'retry-budget'],
  },
  {
    id: 'retry-amplification',
    name: 'Retry amplification',
    aliases: ['retry storm'],
    oneLiner:
      'Each layer retrying 3 times means the bottom layer sees 27x load exactly when it is least able to cope.',
    cluster: 'reliability',
    requires: ['retry'],
    leadsTo: ['retry-budget', 'circuit-breaker', 'cascading-failure'],
  },
  {
    id: 'exponential-backoff',
    name: 'Exponential backoff with jitter',
    oneLiner:
      'Wait longer each time, and randomise, so retries spread out instead of synchronising into a wave.',
    cluster: 'reliability',
    requires: ['retry'],
    leadsTo: ['thundering-herd'],
  },
  {
    id: 'retry-budget',
    name: 'Retry budget',
    oneLiner:
      'Cap retries as a fraction of total traffic, so a broad failure cannot multiply load at all.',
    cluster: 'reliability',
    requires: ['retry-amplification'],
  },
  {
    id: 'circuit-breaker',
    name: 'Circuit breaker',
    oneLiner:
      'Stop calling a dependency that is clearly broken, fail fast, and probe occasionally to see if it recovered.',
    cluster: 'reliability',
    requires: ['retry-amplification', 'timeout'],
    leadsTo: ['graceful-degradation', 'bulkhead'],
  },
  {
    id: 'bulkhead',
    name: 'Bulkhead',
    oneLiner:
      'Separate resource pools per dependency or tenant, so one saturating does not consume the whole ship.',
    cluster: 'reliability',
    requires: ['blast-radius', 'connection-pooling'],
    leadsTo: ['cell-architecture', 'tenant-isolation'],
  },
  {
    id: 'load-shedding',
    name: 'Load shedding',
    oneLiner:
      'Deliberately rejecting work you cannot complete, quickly, so the work you accept still succeeds.',
    cluster: 'reliability',
    requires: ['backpressure', 'throughput-vs-goodput'],
    leadsTo: ['admission-control', 'graceful-degradation'],
    myth: 'Rejecting requests means the system failed.',
    mythCorrection:
      'A system that serves 80% of traffic correctly is more available than one that accepts 100% and times out on all of it. Shedding is how you choose which promise to keep.',
  },
  {
    id: 'admission-control',
    name: 'Admission control',
    oneLiner: 'Deciding at the door which requests get in, by priority, tenant, or cost.',
    cluster: 'reliability',
    requires: ['load-shedding'],
    leadsTo: ['rate-limiting', 'tenant-isolation'],
  },
  {
    id: 'graceful-degradation',
    name: 'Graceful degradation',
    oneLiner:
      'Serving a worse but useful answer when a dependency is gone, instead of an error page.',
    cluster: 'reliability',
    requires: ['circuit-breaker'],
    leadsTo: ['feature-flag'],
  },
  {
    id: 'cascading-failure',
    name: 'Cascading failure',
    oneLiner:
      'A local failure that spreads because the response to it, retries, failover, health checks, adds load.',
    cluster: 'reliability',
    requires: ['retry-amplification', 'timeout'],
    leadsTo: ['load-shedding', 'circuit-breaker', 'health-check'],
  },
  {
    id: 'thundering-herd',
    name: 'Thundering herd',
    oneLiner:
      'Many clients acting at the same instant, because they were all waiting for the same thing.',
    cluster: 'reliability',
    requires: ['exponential-backoff'],
    leadsTo: ['cache-stampede', 'request-coalescing'],
  },
  {
    id: 'hedged-request',
    name: 'Hedged requests',
    oneLiner:
      'Send a second copy of the request if the first is slow, and take whichever answers. Buys tail latency with load.',
    cluster: 'reliability',
    requires: ['tail-latency', 'idempotency'],
    tensionWith: ['cost'],
  },
  {
    id: 'coordinated-omission',
    name: 'Coordinated omission',
    oneLiner:
      'Your load generator stopped sending while the system was stalled, so your latency numbers deleted the worst part.',
    cluster: 'reliability',
    requires: ['percentiles'],
  },
  {
    id: 'noisy-neighbour',
    name: 'Noisy neighbour',
    oneLiner: 'One tenant consuming shared capacity and degrading everyone else.',
    cluster: 'reliability',
    requires: ['bulkhead'],
    leadsTo: ['tenant-isolation', 'rate-limiting'],
  },
  {
    id: 'connection-exhaustion',
    name: 'Connection and descriptor exhaustion',
    oneLiner:
      'Running out of sockets, file descriptors, or pool slots. The failure looks like a hang, not an error.',
    cluster: 'reliability',
    requires: ['connection-pooling'],
    leadsTo: ['cascading-failure'],
  },
  {
    id: 'multi-az',
    name: 'Multi-AZ deployment',
    oneLiner: 'Redundancy across data centres a few milliseconds apart. The cheap, obvious win.',
    cluster: 'reliability',
    requires: ['fault-domain'],
    leadsTo: ['multi-region'],
  },
  {
    id: 'multi-region',
    name: 'Multi-region',
    oneLiner:
      'Redundancy across geography. Buys survival of a regional outage and pays in latency, consistency and money.',
    cluster: 'reliability',
    requires: ['multi-az', 'rtt'],
    leadsTo: ['active-active', 'active-passive', 'data-residency'],
    tensionWith: ['cost', 'consistency-generic'],
    myth: 'Multi-region is how serious systems achieve high availability.',
    mythCorrection:
      'Most outages are caused by deploys, configuration and dependencies, which replicate to every region instantly. Multi-region protects against a rare class of failure and adds a common one: cross-region consistency bugs.',
  },
  {
    id: 'active-active',
    name: 'Active-active',
    oneLiner: 'Every region serves traffic. Best utilisation and latency, hardest consistency.',
    cluster: 'reliability',
    requires: ['multi-region', 'multi-leader'],
    tensionWith: ['active-passive'],
  },
  {
    id: 'active-passive',
    name: 'Active-passive',
    oneLiner:
      'One region serves, another waits. Simpler consistency, and a failover path that is rarely exercised.',
    cluster: 'reliability',
    requires: ['multi-region', 'failover'],
    tensionWith: ['active-active'],
  },
  {
    id: 'rpo',
    name: 'RPO',
    oneLiner: 'How much data you accept losing, measured in time.',
    cluster: 'reliability',
    requires: ['sync-vs-async-replication'],
    leadsTo: ['disaster-recovery'],
  },
  {
    id: 'rto',
    name: 'RTO',
    oneLiner: 'How long you accept being down, measured in time.',
    cluster: 'reliability',
    requires: ['failover'],
    leadsTo: ['disaster-recovery'],
  },
  {
    id: 'disaster-recovery',
    name: 'Disaster recovery',
    oneLiner:
      'The plan for losing a whole region, provider or dataset. Untested plans do not count.',
    cluster: 'reliability',
    requires: ['rpo', 'rto', 'backup'],
    leadsTo: ['chaos-testing'],
  },
  {
    id: 'backup',
    name: 'Backups and restore',
    oneLiner:
      'Replication protects against machine loss; backups protect against you. Only a tested restore is a backup.',
    cluster: 'reliability',
    requires: ['durability'],
    leadsTo: ['disaster-recovery'],
    myth: 'We have replicas, so we have backups.',
    mythCorrection:
      'Replication faithfully copies your DELETE to every replica in milliseconds. Backups exist for logical corruption, bad migrations and ransomware, which replication accelerates rather than prevents.',
  },
  {
    id: 'chaos-testing',
    name: 'Chaos and failure testing',
    oneLiner: 'Injecting the failures you claim to survive, on purpose, while people are awake.',
    cluster: 'reliability',
    requires: ['fault-tolerance'],
    leadsTo: ['incident-response'],
  },

  /* ============================================================ operations */
  {
    id: 'observability',
    name: 'Observability',
    oneLiner:
      'Being able to answer new questions about production without shipping new code.',
    cluster: 'operations',
    requires: ['operability'],
    leadsTo: ['metrics', 'logs', 'traces', 'golden-signals'],
  },
  {
    id: 'metrics',
    name: 'Metrics',
    oneLiner: 'Cheap aggregate numbers over time. Good for "is it broken", bad for "why".',
    cluster: 'operations',
    requires: ['observability'],
    leadsTo: ['cardinality', 'alerting', 'golden-signals'],
  },
  {
    id: 'logs',
    name: 'Logs',
    oneLiner: 'Discrete events with detail. Expensive at volume, irreplaceable during an incident.',
    cluster: 'operations',
    requires: ['observability'],
    leadsTo: ['structured-logging', 'correlation-id'],
  },
  {
    id: 'structured-logging',
    name: 'Structured logging',
    oneLiner: 'Log fields, not sentences, so a machine can filter and aggregate them.',
    cluster: 'operations',
    requires: ['logs'],
  },
  {
    id: 'traces',
    name: 'Distributed tracing',
    oneLiner:
      'One request stitched across every service it touched, which is the only way to find where the time went.',
    cluster: 'operations',
    requires: ['observability', 'correlation-id'],
    leadsTo: ['sampling'],
  },
  {
    id: 'correlation-id',
    name: 'Correlation ID',
    oneLiner: 'One id propagated through every hop and log line. The cheapest observability you can buy.',
    cluster: 'operations',
    requires: ['logs'],
    leadsTo: ['traces'],
  },
  {
    id: 'sampling',
    name: 'Sampling',
    oneLiner:
      'You cannot store every trace. Head sampling is cheap; tail sampling keeps the interesting ones.',
    cluster: 'operations',
    requires: ['traces'],
    tensionWith: ['cost'],
  },
  {
    id: 'cardinality',
    name: 'Cardinality',
    oneLiner:
      'Every distinct label combination is a separate time series. User ID as a label is how you delete your monitoring budget.',
    cluster: 'operations',
    requires: ['metrics'],
    tensionWith: ['cost'],
  },
  {
    id: 'golden-signals',
    name: 'Golden signals, RED and USE',
    oneLiner:
      'Latency, traffic, errors, saturation for services; utilisation, saturation, errors for resources.',
    cluster: 'operations',
    requires: ['metrics'],
    leadsTo: ['alerting', 'bottleneck'],
  },
  {
    id: 'alerting',
    name: 'Alerting',
    oneLiner:
      'Waking a human. Alert on symptoms users feel and on budget burn rate, not on every cause.',
    cluster: 'operations',
    requires: ['slo', 'golden-signals'],
    leadsTo: ['incident-response'],
    myth: 'More alerts means better monitoring.',
    mythCorrection:
      'Every alert that does not require action trains the on-call to ignore alerts. Alert fatigue is a reliability risk, not a nuisance.',
  },
  {
    id: 'incident-response',
    name: 'Incident response',
    oneLiner: 'Roles, communication and a bias toward mitigation before diagnosis.',
    cluster: 'operations',
    requires: ['alerting'],
    leadsTo: ['postmortem'],
  },
  {
    id: 'postmortem',
    name: 'Blameless postmortem',
    oneLiner:
      'Finding the systemic reason a competent person made the wrong call, and changing the system.',
    cluster: 'operations',
    requires: ['incident-response'],
  },
  {
    id: 'ci-cd',
    name: 'CI/CD',
    oneLiner: 'Automated build, test and release, so deploying is boring and therefore frequent.',
    cluster: 'operations',
    leadsTo: ['canary', 'blue-green', 'rollback'],
  },
  {
    id: 'blue-green',
    name: 'Blue-green deployment',
    oneLiner: 'Two full environments, switch traffic at once, switch back if it goes wrong.',
    cluster: 'operations',
    requires: ['ci-cd'],
    tensionWith: ['cost', 'canary'],
  },
  {
    id: 'canary',
    name: 'Canary release',
    oneLiner: 'Give the new version a small slice of real traffic and watch the signals before proceeding.',
    cluster: 'operations',
    requires: ['ci-cd', 'blast-radius'],
    leadsTo: ['feature-flag', 'rollback'],
  },
  {
    id: 'feature-flag',
    name: 'Feature flags',
    oneLiner:
      'Separating deploy from release, so turning something off does not require shipping code.',
    cluster: 'operations',
    requires: ['canary'],
    leadsTo: ['graceful-degradation'],
    tensionWith: ['maintainability'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    oneLiner:
      'Going back to the last good version, which only works if the data written since is still readable by it.',
    cluster: 'operations',
    requires: ['backward-compatibility'],
    leadsTo: ['schema-migration'],
  },
  {
    id: 'schema-migration',
    name: 'Schema migration',
    oneLiner:
      'Changing the shape of live data while two versions of the code are running against it.',
    cluster: 'operations',
    requires: ['backward-compatibility'],
    leadsTo: ['expand-contract', 'backfill'],
  },
  {
    id: 'expand-contract',
    name: 'Expand and contract',
    aliases: ['parallel change'],
    oneLiner:
      'Add the new thing, write both, migrate readers, then remove the old thing. Never rename in one step.',
    cluster: 'operations',
    requires: ['schema-migration'],
    leadsTo: ['backfill'],
  },
  {
    id: 'backfill',
    name: 'Backfill',
    oneLiner:
      'Rewriting history at production scale without saturating the database you are still serving from.',
    cluster: 'operations',
    requires: ['schema-migration', 'backpressure'],
  },
  {
    id: 'strangler-migration',
    name: 'Strangler migration',
    oneLiner:
      'Route slices of traffic to the new system behind a facade until the old one has nothing left to do.',
    cluster: 'operations',
    requires: ['reverse-proxy', 'feature-flag'],
    leadsTo: ['cdc'],
  },
  {
    id: 'iac',
    name: 'Infrastructure as code',
    oneLiner: 'The environment is a reviewable, reproducible artifact rather than an act of memory.',
    cluster: 'operations',
    requires: ['ci-cd'],
    leadsTo: ['disaster-recovery'],
  },
  {
    id: 'capacity-planning',
    name: 'Capacity planning',
    oneLiner:
      'Working out what you need before you need it, from measured per-unit cost and a growth assumption.',
    cluster: 'operations',
    requires: ['back-of-envelope', 'capacity-headroom'],
    leadsTo: ['cost-optimisation', 'autoscaling'],
  },
  {
    id: 'cost-optimisation',
    name: 'Cost optimisation',
    oneLiner:
      'Knowing the unit economics: cost per request, per GB stored, per GB egressed, per engineer-hour.',
    cluster: 'operations',
    requires: ['cost', 'capacity-planning'],
    tensionWith: ['availability', 'multi-region'],
  },
  {
    id: 'control-plane-vs-data-plane',
    name: 'Control plane vs data plane',
    oneLiner:
      'The part that decides versus the part that serves. The data plane must keep working when the control plane is down.',
    cluster: 'operations',
    requires: ['service-discovery'],
    leadsTo: ['blast-radius', 'graceful-degradation'],
  },

  /* ============================================================ security */
  {
    id: 'authn',
    name: 'Authentication',
    oneLiner: 'Proving who you are.',
    cluster: 'operations',
    leadsTo: ['authz', 'session', 'oauth', 'jwt'],
  },
  {
    id: 'authz',
    name: 'Authorization',
    oneLiner: 'Deciding what you may do. Harder than authentication and more often wrong.',
    cluster: 'operations',
    requires: ['authn'],
    leadsTo: ['least-privilege', 'tenant-isolation'],
  },
  {
    id: 'session',
    name: 'Sessions',
    oneLiner: 'Server-side state keyed by an opaque cookie. Revocable, and a lookup on every request.',
    cluster: 'operations',
    requires: ['authn', 'session-state'],
    tensionWith: ['jwt'],
  },
  {
    id: 'jwt',
    name: 'JWT',
    oneLiner:
      'A signed, self-describing token: no lookup needed, and no easy way to take it back before it expires.',
    cluster: 'operations',
    requires: ['authn'],
    tensionWith: ['session'],
    myth: 'JWTs are more secure than sessions.',
    mythCorrection:
      'They are more *scalable* because they avoid a lookup. That same property makes revocation hard, which is why real deployments keep short expiry plus a refresh token, reintroducing the lookup they were avoiding.',
  },
  {
    id: 'oauth',
    name: 'OAuth 2.0 and OIDC',
    oneLiner:
      'Delegated authorization, plus an identity layer on top. Distinct problems, routinely conflated.',
    cluster: 'operations',
    requires: ['authn', 'authz'],
  },
  {
    id: 'secrets-management',
    name: 'Secrets management',
    oneLiner: 'Credentials that are distributed, rotated and audited rather than committed.',
    cluster: 'operations',
    requires: ['least-privilege'],
    leadsTo: ['key-management'],
  },
  {
    id: 'encryption-in-transit',
    name: 'Encryption in transit',
    oneLiner: 'TLS everywhere, including inside your network, because the network is not trusted.',
    cluster: 'operations',
    requires: ['tls'],
  },
  {
    id: 'encryption-at-rest',
    name: 'Encryption at rest',
    oneLiner:
      'Protects against stolen disks and mis-provisioned storage. Does nothing against a compromised application.',
    cluster: 'operations',
    requires: ['key-management'],
  },
  {
    id: 'key-management',
    name: 'Key management',
    oneLiner: 'Where keys live, who may use them, and how they rotate. The actual hard part of encryption.',
    cluster: 'operations',
    requires: ['secrets-management'],
  },
  {
    id: 'rate-limiting',
    name: 'Rate limiting',
    oneLiner: 'A cap on how much one caller may consume, enforced before the work is done.',
    cluster: 'operations',
    requires: ['admission-control'],
    leadsTo: ['token-bucket', 'ddos', 'tenant-isolation'],
  },
  {
    id: 'token-bucket',
    name: 'Token bucket and leaky bucket',
    oneLiner:
      'Token bucket allows bursts up to a stored amount; leaky bucket enforces a smooth rate. Different products.',
    cluster: 'operations',
    requires: ['rate-limiting'],
  },
  {
    id: 'ddos',
    name: 'DDoS mitigation',
    oneLiner:
      'Absorbing or dropping hostile volume at the edge, because your origin cannot be the place it is filtered.',
    cluster: 'operations',
    requires: ['rate-limiting', 'anycast'],
  },
  {
    id: 'threat-modeling',
    name: 'Threat modelling',
    oneLiner: 'Asking who wants to abuse this, what they can reach, and what stops them.',
    cluster: 'operations',
    requires: ['authz'],
    leadsTo: ['least-privilege', 'audit-log'],
  },
  {
    id: 'least-privilege',
    name: 'Least privilege',
    oneLiner: 'Every component gets exactly the access it needs, which bounds what a compromise costs.',
    cluster: 'operations',
    requires: ['authz'],
    leadsTo: ['blast-radius'],
  },
  {
    id: 'tenant-isolation',
    name: 'Tenant isolation',
    oneLiner:
      'One customer must not be able to read, or starve, another. Both halves matter.',
    cluster: 'operations',
    requires: ['authz', 'bulkhead'],
    leadsTo: ['noisy-neighbour', 'cell-architecture'],
  },
  {
    id: 'audit-log',
    name: 'Audit logging',
    oneLiner: 'An append-only record of who did what, which must survive the people it records.',
    cluster: 'operations',
    requires: ['immutability', 'authz'],
  },
  {
    id: 'data-residency',
    name: 'Data residency',
    oneLiner:
      'Legal constraints on where bytes may physically live, which turn architecture into jurisdiction.',
    cluster: 'operations',
    requires: ['multi-region'],
    tensionWith: ['active-active'],
  },
];
