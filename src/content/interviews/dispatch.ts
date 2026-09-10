import type { Scenario } from './types';

/**
 * The write-heavy interview. The prompt sounds like a search problem and is actually a
 * problem about ephemeral state, hot partitions, and where exclusivity is decided.
 *
 * The trap it is built around: candidates reach for a durable geospatial database, and never
 * notice that the write rate is two orders of magnitude above the read rate.
 */
export const DISPATCH: Scenario = {
  id: 'dispatch',
  title: 'Design driver dispatch for a ride-hailing app',
  opening:
    'Design the part of a ride-hailing service that finds nearby drivers for a rider and assigns one of them.',
  difficulty: 'advanced',
  minutes: 40,
  caseStudyId: 'proximity-matching',
  assesses: [
    'requirements',
    'estimation',
    'architecture',
    'data-modelling',
    'scalability',
    'reliability',
    'consistency',
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
        'Design the part of a ride-hailing service that finds nearby drivers for a rider and assigns one of them.',
      note: 'Two problems are hiding in one sentence. Finding them early is most of the interview.',
      next: 'estimate',
      choices: [
        {
          id: 'clarify-both',
          text: 'Before I design anything I want to separate two things. Finding nearby drivers is a spatial read problem, and assigning one is a contention problem — a driver must not be promised to two riders. I also want to know how often drivers report their position, because that sets the write rate, and I suspect it dominates everything. Can I assume a position report every few seconds and an exclusive assignment?',
          quality: 'strong',
          scores: { requirements: 2, architecture: 1, communication: 1 },
          reaction:
            'Yes to both. Every four seconds, and a driver may only be assigned to one ride. Go on.',
          coaching:
            'Splitting the question into a search problem and a contention problem in the first thirty seconds is exactly the framing the rest of the design needs. It also signals that you will not try to solve exclusivity inside the index, which is where most candidates go wrong later.',
          concepts: ['requirement-clarification', 'correctness', 'geospatial-index'],
        },
        {
          id: 'clarify-scale',
          text: 'How many riders and drivers are we talking about, and in how many cities?',
          quality: 'adequate',
          scores: { requirements: 1 },
          reaction:
            'A million drivers online at peak worldwide, and about a hundred thousand ride requests per minute. Does that tell you where the load is?',
          coaching:
            'A fine question, and the answer only becomes useful once you also ask how often drivers report position. Rider requests are a small number; the position stream is not, and the ratio between them is what decides the architecture.',
          concepts: ['requirement-clarification', 'back-of-envelope'],
        },
        {
          id: 'clarify-none',
          text: 'I would store driver locations in a database with a geospatial index and query it with a radius when a rider requests a ride.',
          quality: 'weak',
          scores: { requirements: -2, architecture: -1 },
          reaction:
            'That works. Every driver updates their position every four seconds. What does that do to your index?',
          coaching:
            'Naming a technology before establishing the workload is the classic opening mistake. A spatial index in a database is an excellent answer for data that changes rarely, and this data changes for every driver several times a minute.',
        },
      ],
    },

    {
      id: 'estimate',
      kind: 'estimate',
      prompt:
        'A million drivers online, each reporting position every four seconds. A hundred thousand ride requests a minute. What are the numbers, and what do they tell you?',
      next: 'design',
      nextIfWeak: 'estimate-help',
      choices: [
        {
          id: 'est-good',
          text: 'A million drivers divided by a four-second interval is 250,000 position writes per second. A hundred thousand requests per minute is about 1,700 searches per second. So writes outnumber reads by roughly 150 to 1, which is unusual and it decides the design: this is a write-dominated system whose data is worthless four seconds after it arrives. Storage is trivial — a million drivers at a hundred bytes is 100 MB — so nothing here is a storage problem. It is a write-throughput problem.',
          quality: 'strong',
          scores: { estimation: 2, architecture: 1, communication: 1 },
          reaction:
            'Good, and the last observation is the one I wanted. What follows from data that is worthless after four seconds?',
          coaching:
            'Deriving the 150-to-1 ratio and then saying what it implies is the whole point of estimating. The number on its own proves nothing; the conclusion that this is a write problem with disposable data is what changes the design.',
          concepts: ['back-of-envelope', 'throughput', 'staleness'],
        },
        {
          id: 'est-partial',
          text: 'Roughly 250,000 writes per second and about 1,700 reads per second. That is a lot of writes, so we will need to shard the location store heavily.',
          quality: 'adequate',
          scores: { estimation: 1, scalability: 1 },
          reaction:
            'The arithmetic is right. Sharding handles the volume — but is a durable store the right thing to shard here at all?',
          coaching:
            'The numbers are correct and the conclusion stops one step early. Sharding is how you scale a durable store; the more interesting question is whether the data needs to be durable, and the four-second lifetime answers it.',
          concepts: ['back-of-envelope', 'sharding'],
        },
        {
          id: 'est-vague',
          text: 'It is a lot of writes. We would need something that can handle high write throughput, like a NoSQL store.',
          quality: 'weak',
          scores: { estimation: -2 },
          reaction:
            'How many is a lot? The answer changes what you can build, so I would like the number.',
          coaching:
            'A category of technology is not an estimate. Two hundred and fifty thousand writes per second and twenty-five thousand writes per second lead to different designs, and only the arithmetic distinguishes them.',
        },
      ],
    },

    {
      id: 'estimate-help',
      kind: 'estimate',
      prompt:
        'Let me help. A million drivers, one report every four seconds. How many writes per second, and how does that compare with 1,700 searches per second?',
      next: 'design',
      choices: [
        {
          id: 'help-good',
          text: 'A quarter of a million writes per second, against 1,700 reads. The write path is about 150 times the read path, which is the opposite of almost every consumer system.',
          quality: 'strong',
          scores: { estimation: 1, adaptability: 1 },
          reaction: 'Right. Hold on to that ratio — it should shape everything you say next.',
          coaching:
            'Recovering the number quickly after a prompt is fine; interviewers care much more about whether you use it than about whether you produced it unaided.',
          concepts: ['back-of-envelope', 'throughput'],
        },
        {
          id: 'help-weak',
          text: 'It would be in the hundreds of thousands per second. That is a lot for any database.',
          quality: 'adequate',
          scores: { estimation: 0 },
          reaction: 'It is. So what would you do about it?',
          coaching:
            'Correct order of magnitude. The next move is to ask what those writes are worth — data with a four-second lifetime does not need the machinery that makes a database write expensive.',
        },
      ],
    },

    {
      id: 'design',
      kind: 'design',
      prompt: 'Sketch the design. Where do positions go, and how does a search work?',
      next: 'hotcell',
      nextIfStrong: 'exclusivity',
      choices: [
        {
          id: 'design-cells',
          text: 'Positions go into an in-memory index, replicated for availability but not durable — every driver re-reports within four seconds, so a lost shard refills itself. The index is a map from cell id to the set of drivers in that cell, using a hierarchical cell scheme so cell size can vary with density. A position update removes the driver from the old cell and adds them to the new one, which is two set operations and no tree rebalancing. A search reads the cells covering the rider radius, expanding outward until it has enough candidates or hits a maximum radius.',
          quality: 'strong',
          scores: { architecture: 2, 'data-modelling': 2, scalability: 1 },
          reaction:
            'That is the shape I was looking for. Why hierarchical cells rather than a fixed grid?',
          coaching:
            'Two things make this answer strong: treating position as ephemeral cache rather than durable data, and choosing a structure whose update cost is constant. Naming the expanding-ring search with both stopping rules shows you have thought about the sparse case as well as the dense one.',
          concepts: ['geospatial-index', 'distributed-cache', 'partition-key'],
        },
        {
          id: 'design-db-geo',
          text: 'A database with a spatial index, sharded by region. Drivers update their row, and a search does a radius query against the index for that region.',
          quality: 'adequate',
          scores: { architecture: 0, 'data-modelling': 1 },
          reaction:
            'That is a correct design for data that changes rarely. This data changes 250,000 times a second. What is the index doing?',
          coaching:
            'A spatial tree is restructured on update, so this pays full index maintenance cost a quarter of a million times a second for values that expire in four seconds. A cell-membership map makes each update two constant-time set operations instead.',
          concepts: ['geospatial-index', 'index'],
        },
        {
          id: 'design-latlon',
          text: 'Store latitude and longitude as two indexed columns and query with a bounding box on both.',
          quality: 'weak',
          scores: { architecture: -2, 'data-modelling': -2 },
          reaction:
            'Which index does the planner use, and how many rows does it read to find the ten nearest drivers?',
          coaching:
            'Each index narrows one dimension only. A latitude band five kilometres tall stretches across a continent, so the planner intersects two very wide ranges and reads far more rows than match. This is the specific reason spatial indexing schemes exist.',
        },
      ],
    },

    {
      id: 'hotcell',
      kind: 'pressure',
      prompt:
        'A concert ends. Three thousand drivers are inside one cell and every rider in that cell is searching. What happens?',
      next: 'exclusivity',
      choices: [
        {
          id: 'hot-both',
          text: 'That cell is a hot partition: one shard takes the load while the rest idle. Two fixes at different layers. First, subdivide — a hierarchical scheme lets me use a finer cell level where density is high, which keeps reads proportional to what they actually need. Second, if a single finest-level cell is still too hot, split its membership across K sub-keys so writes spread, accepting that reads must now fan out to all K. I would drive K from measured density rather than fixing it.',
          quality: 'strong',
          scores: { scalability: 2, 'trade-offs': 2 },
          reaction:
            'Good, and you named the cost of the second one. Anything else you would do here?',
          coaching:
            'Distinguishing the two mitigations, and stating that key splitting moves cost onto the read path, is what separates a real answer from naming a technique. Reaching for subdivision first is right, because it reduces work rather than redistributing it.',
          concepts: ['hot-partition', 'key-splitting', 'load-distribution'],
        },
        {
          id: 'hot-shard',
          text: 'Add more shards so the load spreads across more machines.',
          quality: 'weak',
          scores: { scalability: -2 },
          reaction:
            'Every one of those drivers is in the same cell, and the cell is the key. Which shard do the new drivers go to?',
          coaching:
            'Adding shards distributes distinct keys and does nothing for one hot key, because there is nothing left to divide. This is the single most common wrong answer to a hot-key question.',
        },
        {
          id: 'hot-cache',
          text: 'Cache the results of searches in that area so repeated searches do not hit the index.',
          quality: 'adequate',
          scores: { scalability: 0, 'trade-offs': 1 },
          reaction:
            'That helps the reads. The 3,000 drivers are also writing their positions into that cell every four seconds. What about those?',
          coaching:
            'Caching is a reasonable instinct and only addresses half the problem. The read side is 1,700 requests per second overall; the write side is where the concentration actually hurts, and a cache does nothing for writes.',
          concepts: ['cache-generic', 'hot-key'],
        },
      ],
    },

    {
      id: 'exclusivity',
      kind: 'failure',
      prompt:
        'Two riders request at the same instant and your search returns the same driver to both. What stops that driver being promised twice?',
      next: 'expiry',
      choices: [
        {
          id: 'exc-conditional',
          text: 'Not the index — it is stale by construction and cannot adjudicate. The driver has a state row, and the offer is a conditional update: set state to offered where driver id matches and state is available. Check the affected row count; zero means someone else got there first, and that dispatcher moves to its next candidate. The index produces candidates and the state row decides.',
          quality: 'strong',
          scores: { consistency: 2, 'failure-handling': 2, 'data-modelling': 1 },
          reaction:
            'Exactly. And that driver accepts, then their phone dies before confirming. Now what?',
          coaching:
            'Recognising that a stale index cannot decide exclusivity, and pushing the decision to a single atomic conditional write, is the same primitive that decides a seat in a ticketing system. Naming the affected row count matters — a conditional update whose result nobody checks is a check-then-act race with extra steps.',
          concepts: ['optimistic-concurrency', 'lost-update', 'linearizability'],
        },
        {
          id: 'exc-lock',
          text: 'Take a distributed lock on the driver id before offering, and release it after.',
          quality: 'adequate',
          scores: { consistency: 0 },
          reaction:
            'That works if the lock is correct. What happens if a dispatcher holds the lock and then pauses for ten seconds?',
          coaching:
            'A distributed lock can do this and it is a heavier, less reliable version of what the database row already provides atomically. Before adding a lock service, ask whether a conditional write on the authority would do the job — here it plainly would.',
          concepts: ['distributed-lock', 'lease'],
        },
        {
          id: 'exc-index',
          text: 'Remove the driver from the index as soon as they are offered, so the second search cannot see them.',
          quality: 'weak',
          scores: { consistency: -2 },
          reaction:
            'Both searches already returned before either offer was made. What does removing them afterwards fix?',
          coaching:
            'This tries to make the index authoritative, which it cannot be: the candidate list is assembled from positions up to four seconds old and both dispatchers read it before either acted. Exclusivity has to be decided by one write that both attempts pass through.',
        },
      ],
    },

    {
      id: 'expiry',
      kind: 'failure',
      prompt:
        'A driver is offered a ride and their phone loses signal. The offer is never accepted or declined. What happens to the driver, and to the rider?',
      next: 'tradeoff',
      choices: [
        {
          id: 'exp-inquery',
          text: 'The offer carries an expiry a few seconds out, and I evaluate that expiry inside the claim query itself: the driver is claimable if their state is available, or their state is offered and the expiry has passed. That way an expired offer releases the driver without depending on any background job. A sweeper can still exist to keep the data tidy, but correctness does not rest on it. The rider is re-offered to the next candidate.',
          quality: 'strong',
          scores: { 'failure-handling': 2, reliability: 2 },
          reaction:
            'Good. Why do you care so much about not depending on the sweeper?',
          coaching:
            'Evaluating expiry in the transition query rather than in a job is the difference between a system that self-heals and one that strands drivers whenever a background process quietly stops. It is the same rule that governs held seats and held inventory.',
          concepts: ['lease', 'ttl', 'idempotency'],
        },
        {
          id: 'exp-job',
          text: 'A background job scans for offers older than the timeout and releases them.',
          quality: 'adequate',
          scores: { 'failure-handling': 1 },
          reaction:
            'And the day that job stops running, what does the system look like from the outside?',
          coaching:
            'A sweeper works while it runs. When it stops, drivers accumulate in an offered state and supply appears to fall, with nothing obviously broken. Making expiry part of the claim condition removes the dependency entirely.',
          concepts: ['lease'],
        },
        {
          id: 'exp-none',
          text: 'The dispatcher waits for a response and retries with another driver if it does not get one.',
          quality: 'weak',
          scores: { 'failure-handling': -2, reliability: -1 },
          reaction:
            'The dispatcher process is restarted during a deploy while it is waiting. Who releases the driver now?',
          coaching:
            'State held in a waiting process disappears with the process. The driver stays offered forever and nothing in the system knows why. Any hold on a shared resource needs an expiry that lives with the resource, not with the holder.',
        },
      ],
    },

    {
      id: 'tradeoff',
      kind: 'tradeoff',
      prompt:
        "It is New Year's Eve. Request volume in three cities is ten times normal. What degrades, and what do you protect?",
      next: 'wrap',
      choices: [
        {
          id: 'trade-degrade',
          text: 'I protect the assignment path, because a rider who has been promised a driver must not be dropped. I degrade the search: reduce the candidate count, reduce the maximum radius, and rank fewer candidates with real routing. Each of those is a product statement — slightly worse matches instead of no matches — so it can be agreed in advance rather than decided during the incident. Regional isolation means the surge in three cities cannot consume capacity the rest of the world depends on. Admission control on new requests is the last resort, and it applies only to new requests.',
          quality: 'strong',
          scores: { 'trade-offs': 2, reliability: 2, communication: 1 },
          reaction:
            'That is the answer. Abandoning an in-flight rider is much worse than delaying a new one.',
          coaching:
            'Naming what you protect before what you shed, and translating each degradation into a sentence a product owner can agree to, is how graceful degradation becomes a plan rather than an improvisation.',
          concepts: ['graceful-degradation', 'load-shedding', 'admission-control', 'cell-architecture'],
        },
        {
          id: 'trade-scale',
          text: 'Autoscale the search and dispatch tiers to absorb the extra load.',
          quality: 'adequate',
          scores: { scalability: 1, 'trade-offs': 0 },
          reaction:
            'Scaling takes minutes and the surge is now. What do you do in the meantime, and what if the bottleneck is one hot cell?',
          coaching:
            'Autoscaling is part of the answer for sustained load and cannot help with a step change, nor with concentration on a single key. A degradation plan is what covers the gap, and it has to exist before the night it is needed.',
          concepts: ['autoscaling', 'elasticity'],
        },
        {
          id: 'trade-queue',
          text: 'Queue the ride requests and process them as capacity allows.',
          quality: 'weak',
          scores: { 'trade-offs': -1, reliability: -1 },
          reaction:
            'A rider standing in the rain will not wait in a queue for four minutes. What does the product do instead?',
          coaching:
            'Queueing suits work whose result nobody is waiting for. A ride request is a synchronous need with a human attached, so the honest options are a worse match or a fast refusal, not an unbounded wait.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      prompt:
        'Last question. Your in-memory index has no durability. A whole region of index shards restarts. What happens?',
      choices: [
        {
          id: 'wrap-good',
          text: 'It refills within one ping interval, because every driver reports on a timer — and that is why the client must ping even when stationary rather than only on movement. That is a real design constraint and it belongs in the client contract, because skipping stationary pings is an obvious client optimisation that would silently remove the property the whole durability argument rests on. Operationally it means never restarting a whole cell range at once, and keeping a restarted shard out of the read path until it has been accepting writes for a full interval, or it will confidently answer that there are no drivers nearby.',
          quality: 'strong',
          scores: { reliability: 2, 'failure-handling': 2, communication: 2 },
          reaction:
            'That is the answer, including the part about the client. Most people stop at "it refills".',
          coaching:
            'The strong version of this answer names the hidden dependency: the self-healing property is created by the client ping behaviour, so it can be destroyed by a well-intentioned client change. Saying so, and adding the rolling-restart and warm-up rules, is the answer of someone who has operated something like this.',
          concepts: ['graceful-degradation', 'health-check', 'blast-radius'],
        },
        {
          id: 'wrap-ok',
          text: 'Drivers re-report within four seconds, so the index rebuilds itself. We would lose search results for a few seconds in that region.',
          quality: 'adequate',
          scores: { reliability: 1 },
          reaction:
            'True. And during those seconds the region returns no drivers at all. Is that acceptable, and can you shorten it?',
          coaching:
            'The recovery mechanism is right. What is missing is the operational consequence — a shard serving reads before it has refilled reports emptiness with total confidence, so it must stay out of the read path until it has warmed.',
          concepts: ['graceful-degradation'],
        },
        {
          id: 'wrap-weak',
          text: 'We would need to persist the index so it can be recovered after a restart.',
          quality: 'weak',
          scores: { reliability: -1, 'trade-offs': -2 },
          reaction:
            'You would add durability to data that is worthless four seconds later. What does that cost you?',
          coaching:
            'This reverses the design decision that made the write path affordable. The data rebuilds itself for free; paying write-ahead logging and replication costs on 250,000 writes per second to avoid a four-second gap is the trade in the wrong direction.',
        },
      ],
    },
  ],
};
