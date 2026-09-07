import type { Scenario } from './types';

/**
 * The classic opener. It looks trivial and is not: it hides ID generation without
 * coordination, a 100:1 read/write ratio, hot keys, and an abuse surface.
 */
export const URL_SHORTENER: Scenario = {
  id: 'url-shortener',
  title: 'Design a URL shortener',
  opening: 'Design a URL shortener for me. Something like the ones you have used.',
  difficulty: 'core',
  minutes: 35,
  caseStudyId: 'url-shortener',
  assesses: [
    'requirements',
    'estimation',
    'architecture',
    'data-modelling',
    'scalability',
    'consistency',
    'failure-handling',
    'trade-offs',
    'adaptability',
  ],
  startPhase: 'open',
  phases: [
    {
      id: 'open',
      kind: 'clarify',
      prompt: 'Design a URL shortener for me. Something like the ones you have used.',
      note: 'The prompt is deliberately vague. What you do in the next 30 seconds sets the tone.',
      next: 'scale-answer',
      choices: [
        {
          id: 'clarify-good',
          text: 'Before I design anything: how many links are we creating, how many redirects are we serving, and is the read/write ratio what I would expect? Also, do users pick custom aliases, do links expire, and do we need click analytics?',
          quality: 'strong',
          scores: { requirements: 2, communication: 1 },
          reaction:
            'Good. Assume 100 million new links a month and about 10 billion redirects a month. Custom aliases yes, expiry optional, and analytics is a stretch goal.',
          coaching:
            'This is the right opening. The read/write ratio question is the load-bearing one: it is roughly 100:1 here, and that single fact determines almost every subsequent decision.',
          concepts: ['requirement-clarification', 'non-functional-requirements'],
        },
        {
          id: 'clarify-partial',
          text: 'How many users will we have?',
          quality: 'adequate',
          scores: { requirements: 0, communication: 0 },
          reaction:
            'Let us say tens of millions. Does that tell you what you needed to know?',
          coaching:
            'User count alone does not size a system. What you needed was actions per user and the read/write split. "Tens of millions of users" is compatible with 10 requests per second or 100,000.',
          concepts: ['requirement-clarification'],
        },
        {
          id: 'clarify-weak',
          text: 'Sure. We will need a load balancer, an application tier, a Redis cache, and a NoSQL database for the mappings.',
          quality: 'weak',
          scores: { requirements: -2, architecture: -1, communication: -1 },
          reaction:
            'You have an architecture before you have a requirement. Why NoSQL? How much data is there?',
          coaching:
            'Leading with components is the most common failure in system design interviews. You have committed to decisions before knowing anything that would justify them, and you now have to defend choices you made blind.',
        },
      ],
    },

    {
      id: 'scale-answer',
      kind: 'estimate',
      prompt:
        '100 million new links a month, 10 billion redirects a month. What does that mean for the system?',
      next: 'design-v1',
      nextIfWeak: 'estimate-help',
      choices: [
        {
          id: 'est-good',
          text: 'A month is roughly 2.6 million seconds, so that is about 40 writes per second and about 4,000 reads per second on average. With a peak factor of, say, 3 to 5 for a global service, call it 200 writes and 20,000 reads per second at peak. The writes are trivial for any single database. The reads are the interesting number.',
          quality: 'strong',
          scores: { estimation: 2, scalability: 1, communication: 1 },
          reaction:
            'That matches my arithmetic. So where does that leave the storage design?',
          coaching:
            'Exactly right, and note the conclusion you drew: 200 writes per second means no sharding is required for write throughput. Candidates who skip the arithmetic often shard immediately, which is a large amount of complexity bought to solve a problem that does not exist.',
          concepts: ['back-of-envelope', 'throughput'],
        },
        {
          id: 'est-storage',
          text: 'Storage-wise, 100 million links a month is 1.2 billion a year. At roughly 500 bytes per row including indexes, that is about 600 GB a year, which one machine can hold for several years.',
          quality: 'strong',
          scores: { estimation: 2, 'data-modelling': 1 },
          reaction:
            'Good. And the request rates?',
          coaching:
            'A complete answer covers both: storage tells you whether the data fits, request rate tells you whether the machine can serve it. They fail at different times and demand different fixes.',
          concepts: ['back-of-envelope', 'capacity-planning'],
        },
        {
          id: 'est-weak',
          text: 'That is a lot of traffic, so we will definitely need to shard the database and put a distributed cache in front of it.',
          quality: 'weak',
          scores: { estimation: -2, scalability: -1, 'trade-offs': -1 },
          reaction:
            'How much is "a lot"? Give me the number for writes per second.',
          coaching:
            '10 billion a month sounds enormous and is about 4,000 per second, which is unremarkable. Converting to per-second before reacting is the entire point of estimation; without it you cannot tell a hard problem from an easy one.',
        },
      ],
    },

    {
      id: 'estimate-help',
      kind: 'estimate',
      prompt:
        'Let me help. A month is about 2.6 million seconds. What is 10 billion divided by that, roughly?',
      next: 'design-v1',
      choices: [
        {
          id: 'help-good',
          text: 'About 4,000 per second average. And writes are 100 million over the same period, so about 40 per second. So reads are roughly 100 times writes.',
          quality: 'strong',
          scores: { estimation: 1, adaptability: 1 },
          reaction:
            'Right, and that ratio is the most important thing you have learned so far. Now design it.',
          coaching:
            'Recovering quickly when given a hint is genuinely valuable. Interviewers are assessing whether you can be worked with, not only what you already knew.',
          concepts: ['back-of-envelope'],
        },
        {
          id: 'help-weak',
          text: 'I would rather not guess at numbers. Let me describe the architecture instead.',
          quality: 'weak',
          scores: { estimation: -2, adaptability: -2, communication: -1 },
          reaction:
            'The numbers are what tell us which architecture is appropriate. Let us move on, but this will come back.',
          coaching:
            'Declining to estimate is worse than estimating badly. Estimation is explicitly assessed, and refusing removes any chance to show the reasoning even if the arithmetic is shaky.',
        },
      ],
    },

    {
      id: 'design-v1',
      kind: 'design',
      prompt: 'Give me your first version. Keep it as simple as it can be.',
      next: 'id-generation',
      choices: [
        {
          id: 'v1-simple',
          text: 'A stateless service behind a load balancer, and one relational database with a table mapping short code to long URL, primary key on the short code. Redirects are a primary-key lookup. At 200 writes and 20,000 reads per second, a single primary with a couple of read replicas handles this, and I would add a cache only once I have measured that I need one.',
          quality: 'strong',
          scores: { architecture: 2, 'trade-offs': 1, communication: 1 },
          reaction:
            'That is refreshingly small. How do you generate the short code?',
          coaching:
            'Starting simple and saying you expect to evolve it is a seniority signal. The explicit "cache only once measured" is the part that separates this from a memorised answer.',
          concepts: ['statelessness', 'load-balancer', 'index'],
        },
        {
          id: 'v1-cache',
          text: 'Load balancer, stateless services, a cache in front of a key-value store. Redirects hit the cache first, and the key-value store holds the mappings.',
          quality: 'adequate',
          scores: { architecture: 1, 'trade-offs': 0 },
          reaction:
            'Reasonable. Why a key-value store rather than a relational database, given what you calculated?',
          coaching:
            'The design is fine but you skipped the justification. A key-value store is defensible here because every access is a lookup by one key — but you should say that, rather than reaching for it by reflex. The interviewer will ask, and answering after being asked is worth less than volunteering it.',
          concepts: ['cache-generic', 'distributed-cache'],
        },
        {
          id: 'v1-heavy',
          text: 'I would use microservices: a shortening service, a redirect service, an analytics service, and a user service, communicating over a message queue, with a sharded database behind each.',
          quality: 'weak',
          scores: { architecture: -2, 'trade-offs': -2, 'communication': -1 },
          reaction:
            'That is a lot of moving parts for 200 writes a second. What does the queue between shortening and redirect actually do?',
          coaching:
            'Complexity is not a signal of seniority; justified complexity is. Four services and a queue for a workload a single process could serve is a decision that will be picked apart, and there is no defence available because there is no constraint driving it.',
        },
      ],
    },

    {
      id: 'id-generation',
      kind: 'deepen',
      prompt: 'How do you generate the short code? Be specific.',
      next: 'read-scale',
      nextIfStrong: 'custom-alias',
      choices: [
        {
          id: 'id-counter',
          text: 'A monotonic counter encoded in base62. Seven characters of base62 gives about 3.5 trillion codes, which is far more than we need. To avoid a single counter being a bottleneck or a single point of failure, each application instance claims a block of, say, 10,000 IDs at a time from a central allocator, so the allocator is contacted once per 10,000 links rather than once per link.',
          quality: 'strong',
          scores: { 'data-modelling': 2, scalability: 2, 'trade-offs': 1 },
          reaction:
            'Good. What does an attacker learn from sequential codes?',
          coaching:
            'Block allocation is the key insight: it turns a coordination point into an occasional one. The follow-up about enumeration is the standard next question, so pre-empt it by mentioning that sequential codes are guessable and can be scrambled.',
          concepts: ['coordination-cost', 'consensus'],
        },
        {
          id: 'id-hash',
          text: 'Hash the long URL and take the first seven characters of the result. That way the same URL always maps to the same code.',
          quality: 'adequate',
          scores: { 'data-modelling': 1, 'trade-offs': 0 },
          reaction:
            'Two different URLs can produce the same seven characters. What happens then, and what does the deduplication property cost you?',
          coaching:
            'Hashing is a legitimate approach but has two consequences you must raise yourself: collisions need a resolution strategy with a conditional write, and deduplicating identical URLs means two users cannot have separate analytics or separate expiry for the same target.',
          concepts: ['idempotency', 'optimistic-concurrency'],
        },
        {
          id: 'id-random',
          text: 'Generate a random seven-character string and check whether it exists. If it does, generate another.',
          quality: 'adequate',
          scores: { 'data-modelling': 1, scalability: 0 },
          reaction:
            'That needs a read before every write. What happens to the collision rate as the table fills?',
          coaching:
            'Random generation avoids enumeration and needs no coordination, which is a real advantage. The costs to name: a read-check per write, a race between check and insert that requires a unique constraint to close, and a collision rate that rises as the key space fills.',
          concepts: ['optimistic-concurrency', 'lost-update'],
        },
      ],
    },

    {
      id: 'custom-alias',
      kind: 'pressure',
      prompt:
        'Users want custom aliases. Two people try to claim the same alias at the same moment, on two different servers. What happens?',
      next: 'read-scale',
      choices: [
        {
          id: 'alias-unique',
          text: 'A unique constraint on the alias column, and an insert that fails for the loser. The database is the only thing that can adjudicate this correctly, so I let it: whichever insert commits first wins, and the other returns "already taken". No application-level check-then-insert, because that race is exactly what we are trying to avoid.',
          quality: 'strong',
          scores: { consistency: 2, 'data-modelling': 1, 'trade-offs': 1 },
          reaction:
            'Correct, and you avoided the trap. Now, reads.',
          coaching:
            'The important phrase is "no application-level check-then-insert". A SELECT followed by an INSERT is the canonical lost-update race, and it is what most candidates propose here.',
          concepts: ['lost-update', 'optimistic-concurrency', 'atomicity'],
        },
        {
          id: 'alias-lock',
          text: 'I would take a distributed lock on the alias string before checking and inserting.',
          quality: 'adequate',
          scores: { consistency: 0, 'trade-offs': -1 },
          reaction:
            'You now have a distributed lock in the write path. What guarantees does it actually give you, and what does the database constraint give you for free?',
          coaching:
            'A distributed lock here is a heavier and less reliable version of something the database already does correctly and atomically. Reaching for coordination when a unique constraint suffices is a common over-engineering tell.',
          concepts: ['distributed-lock', 'fencing-token'],
        },
        {
          id: 'alias-check',
          text: 'Check whether the alias exists, and if it does not, insert it.',
          quality: 'weak',
          scores: { consistency: -2 },
          reaction:
            'Both servers check at the same moment, both see nothing, both insert. Now what?',
          coaching:
            'This is a read-modify-write race. Between your check and your write, the world changed. The fix is to make the check and the write a single atomic operation — which for this case means letting a unique constraint do it.',
          concepts: ['lost-update'],
        },
      ],
    },

    {
      id: 'read-scale',
      kind: 'pressure',
      prompt:
        'Redirect traffic grows to 200,000 per second at peak, and one link in a viral campaign is 2 million of those per second on its own. What changes?',
      next: 'cache-failure',
      choices: [
        {
          id: 'read-good',
          text: 'Two different problems. The 200,000 aggregate is solved by caching: mappings are immutable once created, so they cache perfectly with a long TTL and a very high hit rate. The 2 million on one key is a hot key, and a shared cache does not help because that key lives on one node. For that I would serve the redirect from the edge — it is a cacheable HTTP redirect for an immutable mapping — and fall back to a small in-process cache on each application server.',
          quality: 'strong',
          scores: { scalability: 2, 'trade-offs': 2, architecture: 1 },
          reaction:
            'Good, you separated the two. What is the cost of the edge answer?',
          coaching:
            'Recognising that aggregate load and single-key load are different problems is the point of this question. Immutability is what makes both solutions cheap, and saying so shows you understand why, not just what.',
          concepts: ['hot-key', 'cdn', 'local-cache', 'immutability'],
        },
        {
          id: 'read-cache',
          text: 'Add a distributed cache with a high hit rate. The mappings never change, so caching is nearly free.',
          quality: 'adequate',
          scores: { scalability: 1, 'trade-offs': 0 },
          reaction:
            'That handles the aggregate. But 2 million requests per second for one key all land on whichever cache node owns it. What then?',
          coaching:
            'You got the easy half. A hot key cannot be partitioned by definition, so the only options are to replicate it, move it closer to the reader, or serve it from the edge. Naming the hot key as a distinct problem is what was being tested.',
          concepts: ['cache-generic', 'hot-key'],
        },
        {
          id: 'read-shard',
          text: 'Shard the database by short code so the load spreads across more machines.',
          quality: 'weak',
          scores: { scalability: -1, 'trade-offs': -1 },
          reaction:
            'Sharding spreads distinct keys. Every one of those 2 million requests is the same key, so they all land on the same shard. Does sharding help?',
          coaching:
            'Sharding is a solution to aggregate load and dataset size, not to skew. A single key is indivisible, so no partitioning scheme can spread it. This distinction is one of the most reliable ways to separate candidates.',
          concepts: ['sharding', 'hot-key', 'hot-partition'],
        },
      ],
    },

    {
      id: 'cache-failure',
      kind: 'failure',
      prompt: 'Your cache tier restarts and comes back empty. Walk me through the next 60 seconds.',
      next: 'abuse',
      choices: [
        {
          id: 'fail-good',
          text: 'Every request becomes a miss, so the database goes from about 5% of read traffic to 100% of it. At 200,000 reads per second against a database sized for 10,000, that is 20 times its capacity — it will not degrade, it will fall over, and then the retries make it worse. I would want three things in place beforehand: request coalescing so one miss per key reaches the origin rather than thousands, load shedding at the service so we serve some traffic correctly instead of all of it badly, and staggered TTLs so keys never expire in a synchronised wave.',
          quality: 'strong',
          scores: { 'failure-handling': 2, reliability: 2, 'trade-offs': 1 },
          reaction:
            'That is the answer I was looking for. Most people say "the cache warms up again".',
          coaching:
            'Quantifying the overload factor is what makes this answer credible. "The database gets more load" is an observation; "20 times its capacity, so it fails rather than slows" is an engineering statement.',
          concepts: ['cache-stampede', 'request-coalescing', 'load-shedding', 'thundering-herd'],
        },
        {
          id: 'fail-partial',
          text: 'There would be a spike of database load while the cache refills. I would add request coalescing so that concurrent misses for the same key only produce one database read.',
          quality: 'adequate',
          scores: { 'failure-handling': 1, reliability: 1 },
          reaction:
            'Coalescing helps for a single hot key. But every key is missing simultaneously, and they are all different. Is coalescing enough?',
          coaching:
            'Coalescing solves duplicate work on the same key. A cold cache is a different shape of problem: millions of distinct keys, each legitimately needing one origin read. That volume has to be shed or absorbed, not deduplicated.',
          concepts: ['request-coalescing', 'cache-stampede'],
        },
        {
          id: 'fail-weak',
          text: 'The cache would repopulate as requests come in, so it should recover on its own within a minute or two.',
          quality: 'weak',
          scores: { 'failure-handling': -2, reliability: -2 },
          reaction:
            'It repopulates only if the database survives long enough to serve those misses. Does it?',
          coaching:
            'This is the single most common wrong answer about caching. The system was only ever viable because the cache absorbed 95% of reads; removing it exposes an origin that was never sized for the real request rate.',
        },
      ],
    },

    {
      id: 'abuse',
      kind: 'pressure',
      prompt:
        'Someone is using your service to shorten links to malware, and someone else is scripting a million link creations an hour. What do you do?',
      next: 'wrap',
      choices: [
        {
          id: 'abuse-good',
          text: 'Two separate problems. For creation volume: rate limit per authenticated identity and per IP with a token bucket, applied at the edge so the cost of rejecting is small, and require authentication above a low anonymous threshold. For malicious targets: check the destination against a reputation service asynchronously at creation, re-check periodically since a benign URL can turn malicious later, and support fast takedown — which means the redirect path needs a way to invalidate a cached mapping, and I said earlier that these were immutable and cached forever. That assumption has to change: I would keep a small denylist checked on the redirect path.',
          quality: 'strong',
          scores: { reliability: 2, 'trade-offs': 2, adaptability: 2, architecture: 1 },
          reaction:
            'You noticed that this breaks your earlier caching assumption. That is the answer.',
          coaching:
            'The strongest thing here is catching the contradiction with your own earlier design. Interviewers introduce abuse specifically because it usually invalidates an assumption made 20 minutes earlier, and noticing that unprompted is rare.',
          concepts: ['rate-limiting', 'token-bucket', 'cache-invalidation', 'threat-modeling'],
        },
        {
          id: 'abuse-partial',
          text: 'Rate limiting per user and per IP address, and a blocklist of known-bad domains checked when the link is created.',
          quality: 'adequate',
          scores: { reliability: 1, 'trade-offs': 0 },
          reaction:
            'A link that is safe at creation and malicious a week later. What does your cached, immutable mapping do about that?',
          coaching:
            'A creation-time check cannot catch a target that changes later. This also collides with the "immutable, cache forever" decision you made earlier — takedown requires invalidation, which means the caching story needs revisiting.',
          concepts: ['rate-limiting', 'cache-invalidation'],
        },
        {
          id: 'abuse-weak',
          text: 'Add a CAPTCHA on the creation form.',
          quality: 'weak',
          scores: { reliability: -1, 'trade-offs': -1 },
          reaction:
            'That is a front-end control on one entry point. What about the API, and what about the malicious links already in the system?',
          coaching:
            'Abuse prevention is an architectural concern, not a form control. The questions to answer are: what identity is being limited, where is the limit enforced, and how do you remove content that is already live.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      prompt:
        'We are nearly out of time. If you had to name the weakest part of your design, what would it be?',
      choices: [
        {
          id: 'wrap-good',
          text: 'The redirect path now depends on an edge cache, an origin cache, a database, and a denylist check. That is four things in series on the request that matters most, and availability multiplies. I would want to make the denylist check fail open with a locally cached copy, so an outage in that dependency degrades safety rather than availability — and I would want that decision to be a deliberate, documented one rather than an accident.',
          quality: 'strong',
          scores: { reliability: 2, 'trade-offs': 2, communication: 2 },
          reaction:
            'Good. Naming your own weakest link, with the arithmetic behind it, is a strong close.',
          coaching:
            'Self-critique with a specific mechanism is one of the highest-signal things you can do in the last two minutes. It shows you evaluate your own designs the way a reviewer would.',
          concepts: ['availability-math', 'graceful-degradation', 'blast-radius'],
        },
        {
          id: 'wrap-generic',
          text: 'Probably the database — it could become a bottleneck as we grow.',
          quality: 'adequate',
          scores: { 'trade-offs': 0, communication: 0 },
          reaction: 'Which part of it, and at what number?',
          coaching:
            '"The database might be a bottleneck" is true of every system ever designed, which makes it uninformative. A specific weakness with a threshold attached is worth far more.',
        },
        {
          id: 'wrap-none',
          text: 'I think the design covers the requirements well.',
          quality: 'weak',
          scores: { 'trade-offs': -2, communication: -1 },
          reaction: 'Every design has a weakest part. Not knowing yours is itself the answer.',
          coaching:
            'Declining to critique your own work reads as either overconfidence or a shallow model of the system. There is always a component whose failure hurts most; know which one it is.',
        },
      ],
    },
  ],
};
