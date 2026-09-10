import type { Scenario } from './types';

/**
 * The contention interview. The traffic is large but not extraordinary; what makes it hard is
 * that the resource is finite, demand arrives at an advertised instant, and nearly every request
 * is destined to fail. Being assessed: whether the candidate sees that the job is rejecting
 * people cheaply and fairly, rather than serving them quickly.
 */
export const TICKET_BOOKING: Scenario = {
  id: 'ticket-booking',
  title: 'Design ticket sales for a sold-out show',
  opening:
    'Design ticket sales for a concert. Twenty thousand seats go on sale at ten o’clock, and half a million people want them.',
  difficulty: 'advanced',
  minutes: 40,
  caseStudyId: 'ticket-booking',
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
        'Design ticket sales for a concert. Twenty thousand seats go on sale at ten o’clock, and half a million people want them.',
      note: 'The numbers in the prompt are doing a lot of work. So is what they leave out.',
      next: 'estimate',
      choices: [
        {
          id: 'clarify-invariant',
          text: 'First, what must never happen. I assume selling the same seat twice is unacceptable - is overselling ever allowed? Then: are these assigned seats or general admission, and how long does someone get to hold a seat while they pay? Assigned seats means contention per seat; general admission is a single counter, which is a much easier problem.',
          quality: 'strong',
          scores: { requirements: 2, consistency: 1, communication: 1 },
          reaction:
            'No overselling, ever. Assigned seats. Ten minutes to pay once you hold a seat.',
          coaching:
            'Leading with the invariant is right for any finite-resource problem. The seat-assignment question is the one that separates candidates: it decides whether you are adjudicating identity or decrementing a number.',
          concepts: ['requirement-clarification', 'lost-update', 'lease'],
        },
        {
          id: 'clarify-scale',
          text: 'What request rate should I design for, and what latency is acceptable for the purchase?',
          quality: 'adequate',
          scores: { requirements: 1, estimation: 1 },
          reaction:
            'Most of the half million arrive in the first minute. Latency matters less than you would think. What else do you need to know?',
          coaching:
            'Volume is worth having, but this question is about correctness under concentration. Ask what must never happen before asking how fast it must happen.',
          concepts: ['back-of-envelope'],
        },
        {
          id: 'clarify-counter',
          text: 'I will keep a count of remaining tickets and decrement it on each purchase, refusing when it reaches zero.',
          quality: 'weak',
          scores: { requirements: -2, 'data-modelling': -1 },
          reaction:
            'A customer wants row J, seat fourteen. Where is that in your counter?',
          coaching:
            'A counter is the right primitive for general admission and the wrong one for named seats, because it cannot say which seat was sold. Asking about seat assignment first would have caught this.',
          concepts: ['optimistic-concurrency'],
        },
      ],
    },

    {
      id: 'estimate',
      kind: 'estimate',
      prompt: 'Half a million people, twenty thousand seats, most arriving in the first minute. What do the numbers tell you?',
      next: 'claim',
      nextIfWeak: 'estimate-help',
      choices: [
        {
          id: 'est-good',
          text: 'Half a million in sixty seconds is about eight thousand attempts a second. That is not a remarkable write rate on its own - what makes it hard is that every attempt targets rows belonging to one event, so no partitioning scheme spreads it. And twenty thousand seats against half a million people means twenty-four of every twenty-five requests cannot succeed. The design is mostly about rejecting ninety-six per cent of traffic cheaply, and the seat data itself is a few megabytes.',
          quality: 'strong',
          scores: { estimation: 2, scalability: 1, communication: 1 },
          reaction:
            'Good. Ninety-six per cent failure is the number most people never compute. Now, how does one seat get claimed?',
          coaching:
            'Two conclusions made this estimate count: the load concentrates on one partition, so sharding cannot help, and almost all of it must fail. Both change the design before you draw a box.',
          concepts: ['back-of-envelope', 'hot-partition', 'admission-control'],
        },
        {
          id: 'est-rate',
          text: 'Roughly eight thousand purchase attempts a second at the peak, dropping sharply after the first minute.',
          quality: 'adequate',
          scores: { estimation: 1 },
          reaction: 'Right rate. How many of those can possibly succeed?',
          coaching:
            'Correct arithmetic that stops one step short. Comparing attempts to seats reveals that almost all the traffic is doomed, which is what makes admission control the centre of the design.',
          concepts: ['back-of-envelope'],
        },
        {
          id: 'est-storage',
          text: 'Twenty thousand seats with some metadata is only a few megabytes, so storage is trivial and a single database will do.',
          quality: 'weak',
          scores: { estimation: -1, scalability: -1 },
          reaction:
            'Storage is trivial, agreed. Eight thousand writes a second to one event’s rows - is that also trivial?',
          coaching:
            'Half right, and the wrong half matters. The data is small; the contention on it is not. Size the concurrency, not the bytes.',
          concepts: ['hot-partition'],
        },
      ],
    },

    {
      id: 'estimate-help',
      kind: 'estimate',
      prompt:
        'Let me narrow it. Twenty thousand seats, half a million buyers. What fraction of purchase attempts can succeed?',
      next: 'claim',
      choices: [
        {
          id: 'help-good',
          text: 'Twenty thousand over half a million is four per cent. So ninety-six per cent of attempts fail no matter how the system is built, and the question becomes where and how cheaply they fail.',
          quality: 'strong',
          scores: { estimation: 2, architecture: 1 },
          reaction: 'Exactly. Keep that in mind for everything that follows.',
          coaching:
            'Framing failure as the dominant workload is the insight that makes a waiting room obvious rather than clever.',
          concepts: ['admission-control', 'load-shedding'],
        },
        {
          id: 'help-adequate',
          text: 'Only a small fraction - most people will not get a ticket.',
          quality: 'adequate',
          scores: { estimation: 1 },
          reaction: 'Put a number on it. It will justify a design decision in a minute.',
          coaching:
            'The instinct is right. A specific number - four per cent - is what lets you argue that rejection deserves its own tier.',
          concepts: ['back-of-envelope'],
        },
      ],
    },

    {
      id: 'claim',
      kind: 'design',
      prompt: 'Two people click seat J14 at the same millisecond. Walk me through exactly how exactly one of them gets it.',
      next: 'rush',
      choices: [
        {
          id: 'claim-conditional',
          text: 'One conditional update: set the seat to held, with my hold token and an expiry, where the seat id matches and the state is available - or held with an expiry in the past. Then check the affected row count. One row, the seat is mine; zero, somebody else got it. The database row is the only thing that sees both requests, so it has to be the thing that adjudicates, and evaluating expiry inside the same statement means an abandoned hold is reclaimed without depending on a cleanup job.',
          quality: 'strong',
          scores: { consistency: 2, 'data-modelling': 2, architecture: 1 },
          reaction:
            'Exactly right, including the expiry. Now all half million arrive at once.',
          coaching:
            'The affected-row check and the expiry in the predicate are the two details interviewers listen for. The first prevents the race; the second removes a background job from the correctness path.',
          concepts: ['optimistic-concurrency', 'lost-update', 'lease'],
        },
        {
          id: 'claim-lock',
          text: 'Take a distributed lock on the seat id, check whether it is available, mark it held, then release the lock.',
          quality: 'adequate',
          scores: { consistency: 1, architecture: -1 },
          reaction:
            'The lock holder pauses for a garbage collection, the lock expires, and a second buyer takes it. What stops both writing?',
          coaching:
            'Correct in the happy path and fragile outside it: a lock service adds a dependency and a failure mode, and without a fencing token a paused holder can still write after its lock expired. The row can be its own lock.',
          concepts: ['distributed-lock', 'fencing-token'],
        },
        {
          id: 'claim-read-write',
          text: 'Read the seat. If it is available, update it to sold for this customer.',
          quality: 'weak',
          scores: { consistency: -2, 'data-modelling': -1 },
          reaction:
            'Both read available at the same moment, and both write. Who has the seat?',
          coaching:
            'Read-then-write across a round trip is the textbook lost update, and at eight thousand attempts a second on one event it will oversell within seconds. The check and the write must be one statement.',
          concepts: ['lost-update', 'isolation-levels'],
        },
      ],
    },

    {
      id: 'rush',
      kind: 'pressure',
      prompt:
        'Correct for two buyers. Now half a million arrive at 10:00:00. What happens to your database, and what do you change?',
      next: 'payment',
      choices: [
        {
          id: 'rush-room',
          text: 'Do not let them reach it. A waiting room at the edge gives each arrival a token with a position and admits a controlled rate - a couple of thousand a second - into the booking path. Everyone else gets a page that says where they are. The seat store sees a rate I chose rather than one the public chose, and the refusal happens at the edge where it costs almost nothing, instead of inside a database transaction on the most contended rows in the system.',
          quality: 'strong',
          scores: { scalability: 2, architecture: 2, reliability: 1 },
          reaction:
            'That is the key move. Now the payment provider takes eight seconds and sometimes times out.',
          coaching:
            'Admission control converts a contention problem into an arrival-rate problem. The general principle: when demand exceeds a fixed resource by orders of magnitude, the queue will form somewhere, so choose where.',
          concepts: ['admission-control', 'load-shedding', 'thundering-herd', 'token-bucket'],
        },
        {
          id: 'rush-async',
          text: 'Put purchase requests on a queue and have workers process them in order, so the database sees a steady rate.',
          quality: 'adequate',
          scores: { scalability: 1, architecture: 0, 'trade-offs': -1 },
          reaction:
            'Half a million requests queued, and the customer at position four hundred thousand waits ten minutes to be told the show sold out five minutes ago. Is that a good experience?',
          coaching:
            'Queuing protects the database, which is the right instinct, but a queue of doomed requests is still doing work for nobody. Admit at the edge and tell people honestly where they stand rather than accepting requests you cannot serve.',
          concepts: ['queue-depth', 'backpressure'],
        },
        {
          id: 'rush-scale',
          text: 'Shard the seat table and add read replicas so the database can absorb the load.',
          quality: 'weak',
          scores: { scalability: -2, 'trade-offs': -1 },
          reaction:
            'Every one of those requests is for the same event. Which shard do they go to?',
          coaching:
            'Sharding spreads load across keys, and this load is concentrated on one event by construction. Replicas serve reads, and this is a write problem. Neither changes the fact that only four per cent can succeed.',
          concepts: ['sharding', 'hot-partition'],
        },
      ],
    },

    {
      id: 'payment',
      kind: 'failure',
      prompt:
        'A buyer holds a seat and pays. The payment provider times out after eight seconds. You do not know whether the card was charged. What do you do with the seat?',
      next: 'fairness',
      choices: [
        {
          id: 'pay-hold',
          text: 'Keep holding it. A timeout is not a failure, it is an absence of information. The charge was sent with an idempotency key, so I can ask the provider for the outcome by that key, or retry safely. The seat stays held until I actually know, with the hold expiry as the backstop. Releasing it now risks charging someone and selling their seat to somebody else.',
          quality: 'strong',
          scores: { 'failure-handling': 2, consistency: 2, reliability: 1 },
          reaction:
            'Right. That failure mode is the one that ends up in the newspaper.',
          coaching:
            'Treating a timeout as unknown rather than failed is the whole point, and the idempotency key is what makes asking again safe. The payment call must also never sit inside the transaction that holds the seat row.',
          concepts: ['idempotency-key', 'saga', 'timeout'],
        },
        {
          id: 'pay-retry',
          text: 'Retry the payment a few times, and if it still fails, release the seat and tell the customer to try again.',
          quality: 'adequate',
          scores: { 'failure-handling': 0, reliability: 0 },
          reaction:
            'The first attempt actually succeeded. Your retries - did they charge the card again?',
          coaching:
            'Retrying is reasonable only if the charge is idempotent, and releasing on failure is wrong when failure might mean "succeeded, reply lost". Both hinge on an idempotency key you have not mentioned.',
          concepts: ['retry', 'idempotency'],
        },
        {
          id: 'pay-release',
          text: 'Release the seat back to the pool so another buyer can have it, and show the customer an error.',
          quality: 'weak',
          scores: { 'failure-handling': -2, consistency: -1 },
          reaction:
            'The charge settles a minute later. The customer has paid, and seat J14 now belongs to someone else.',
          coaching:
            'Releasing on a timeout is the intuitive compensation and the costly one. Compensate only on a known outcome; until then, the hold is what protects the customer.',
          concepts: ['saga', 'timeout'],
        },
      ],
    },

    {
      id: 'fairness',
      kind: 'tradeoff',
      prompt:
        'The sale ends in ninety seconds and the press reports that bots bought most of the tickets. The promoter wants it to be fair next time. What do you do?',
      next: 'wrap',
      choices: [
        {
          id: 'fair-structural',
          text: 'First ask what they mean by fair, because arrival order and fairness are different things. The waiting room already helps if its tokens are the only way into the booking path: capacity is then allocated by position in the queue, and hammering the API gains nothing. Then per-account and per-payment-card limits, accounts that existed before the sale was announced, and a cap per order. If they genuinely want fairness rather than speed, I would propose a registration window and a lottery: it removes the rush entirely and cannot be won with better hardware.',
          quality: 'strong',
          scores: { 'trade-offs': 2, adaptability: 2, requirements: 1 },
          reaction:
            'The lottery is where a lot of large operators have ended up. Good.',
          coaching:
            'The strongest move is questioning the requirement: a first-come race rewards whoever is fastest, which is exactly what bots are. Changing the mechanism beats defending the old one, and knowing when to propose it is the adaptability being assessed.',
          concepts: ['admission-control', 'rate-limiting', 'tenant-isolation'],
        },
        {
          id: 'fair-ip',
          text: 'Rate-limit purchase attempts per IP address so no single client can flood the system.',
          quality: 'adequate',
          scores: { 'trade-offs': 0, adaptability: 0 },
          reaction:
            'A university shares one address for ten thousand students. A bot operator rents ten thousand addresses. Who does this stop?',
          coaching:
            'Per-IP limits punish shared networks and barely inconvenience anyone with a proxy pool. Limit by the things that cost an attacker money to multiply - accounts, payment instruments - and control entry rather than attempts.',
          concepts: ['rate-limiting', 'token-bucket'],
        },
        {
          id: 'fair-captcha',
          text: 'Add a CAPTCHA to the checkout page to block automated buyers.',
          quality: 'weak',
          scores: { 'trade-offs': -1, adaptability: -1 },
          reaction:
            'Solving services clear them for fractions of a cent, and your real customers now fail them under time pressure. What changed?',
          coaching:
            'A CAPTCHA adds friction for humans at the worst possible moment and is a solved problem for a funded attacker. Fairness here is a structural property of how capacity is allocated, not a checkbox on one page.',
          concepts: ['rate-limiting'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      prompt: 'Last question. The morning after the sale, how do you know it went right?',
      choices: [
        {
          id: 'wrap-good',
          text: 'The invariant is the first check: count seats with more than one confirmed order, which must be zero, and treat anything else as an incident. Then holds that never resolved - reserved seats with no order and no expiry - because they are inventory silently lost. Payments with an unknown outcome reconciled against the provider in both directions. And for the rush itself, the waiting room admission rate against the seat store latency, so I can see whether the rate I chose was actually the right one.',
          quality: 'strong',
          scores: { reliability: 2, 'failure-handling': 1, communication: 2 },
          reaction: 'Checking the invariant directly, rather than trusting the code, is the right instinct.',
          coaching:
            'Verifying the invariant as a query - no seat sold twice - is worth more than any amount of reasoning about why it could not happen. Stuck holds and unreconciled payments are the two failures that produce no error.',
          concepts: ['audit-log', 'alerting', 'observability'],
        },
        {
          id: 'wrap-adequate',
          text: 'Look at the error rate and latency during the sale, and check for any customer complaints.',
          quality: 'adequate',
          scores: { reliability: 1, communication: 0 },
          reaction: 'Suppose there were no errors and no complaints yet. Could you still have oversold?',
          coaching:
            'Error rates will not show an oversold seat or a lost hold, and complaints arrive at the gate weeks later. Query the invariant itself.',
          concepts: ['alerting'],
        },
      ],
    },
  ],
};
