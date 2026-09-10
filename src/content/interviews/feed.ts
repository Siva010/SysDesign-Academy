import type { Scenario } from './types';

/**
 * The fanout interview, and the most commonly asked system design question there is.
 *
 * Its shape is a trap: the obvious answer (precompute every timeline) is correct for almost
 * every account and catastrophic for a handful, and the candidate who commits to either pure
 * strategy before asking about the follower distribution has already lost the thread. What is
 * being assessed is whether you notice that one number - the tail of the follower count - and
 * let it split the design.
 */
export const FEED: Scenario = {
  id: 'feed',
  title: 'Design a home timeline',
  opening:
    'Design the home timeline for a social network. When someone opens the app, they see recent posts from the accounts they follow.',
  difficulty: 'core',
  minutes: 40,
  caseStudyId: 'social-feed',
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
        'Design the home timeline for a social network. When someone opens the app, they see recent posts from the accounts they follow.',
      note: 'Deliberately underspecified. What you ask for first is part of the answer.',
      next: 'estimate',
      choices: [
        {
          id: 'clarify-distribution',
          text: 'Before anything else I want the shape of the follower distribution. Is it roughly uniform, or do we have accounts with tens of millions of followers? And is the timeline strictly reverse-chronological, or ranked? Those two answers decide almost everything else.',
          quality: 'strong',
          scores: { requirements: 2, architecture: 1, communication: 1 },
          reaction:
            'Heavily skewed. The median account has about two hundred followers; the largest have over a hundred million. Assume reverse-chronological for now.',
          coaching:
            'The follower distribution is the question. A feed design that works for the median account and ignores the tail is the single most common failure in this interview, and asking up front means the rest of your design can be built around it rather than patched later.',
          concepts: ['requirement-clarification', 'hot-key', 'fanout-on-write'],
        },
        {
          id: 'clarify-scale',
          text: 'How many daily active users are we designing for, and how many posts per day?',
          quality: 'adequate',
          scores: { requirements: 1, estimation: 1 },
          reaction:
            'Five hundred million daily actives, about a hundred million posts a day. Where does that take you?',
          coaching:
            'A fair opening that gets you the volume but not the shape. Totals tell you how much machinery you need; the distribution tells you what kind. Follow it up by asking how lopsided the follower counts are.',
          concepts: ['back-of-envelope'],
        },
        {
          id: 'clarify-jump',
          text: 'I will store posts in a table, and when a user opens the app, query for posts from everyone they follow, ordered by time.',
          quality: 'weak',
          scores: { requirements: -2, architecture: -1 },
          reaction:
            'A user following two thousand accounts opens the app. That query touches two thousand partitions and has to merge them, at sixty thousand requests a second. What does that cost?',
          coaching:
            'Starting with the query is starting at the end. A read-time merge across every followed account is the design you should be able to reject with arithmetic, not the one you offer first.',
          concepts: ['fanout-on-read', 'cross-shard-query'],
        },
      ],
    },

    {
      id: 'estimate',
      kind: 'estimate',
      prompt:
        'Five hundred million daily actives, a hundred million posts a day, median two hundred followers. Users open the app about ten times a day. Give me the numbers that matter.',
      next: 'fanout',
      nextIfWeak: 'estimate-help',
      choices: [
        {
          id: 'est-good',
          text: 'A hundred million posts a day is about twelve hundred a second, call it five thousand at peak. Reads are five hundred million times ten, so five billion a day, around sixty thousand a second and maybe two hundred thousand at peak. So reads outnumber writes by roughly fifty to one, which argues for doing the work at write time. But the fanout multiplies: twelve hundred posts a second times two hundred followers is about a quarter of a million timeline writes a second on average, and that is before the tail.',
          quality: 'strong',
          scores: { estimation: 2, scalability: 1, communication: 1 },
          reaction:
            'Good. Now do the tail. One account with a hundred million followers posts. What happens?',
          coaching:
            'Carrying the fanout multiplier through is what makes this estimate useful rather than decorative. The ratio justifies precomputing; the multiplier is what tells you precomputing is not free.',
          concepts: ['back-of-envelope', 'fanout-on-write', 'fanout-latency-amplification'],
        },
        {
          id: 'est-partial',
          text: 'About twelve hundred posts a second and sixty thousand timeline reads a second. Reads dominate by a wide margin, so we should precompute timelines rather than assembling them on demand.',
          quality: 'adequate',
          scores: { estimation: 1, architecture: 1 },
          reaction:
            'Right conclusion. What does precomputing actually cost per post?',
          coaching:
            'The ratio is correct and the conclusion follows, but the cost of the strategy you just chose is the number the interviewer wants. Multiply posts by average followers and you get the write amplification that decides whether it is affordable.',
          concepts: ['back-of-envelope', 'fanout-on-write'],
        },
        {
          id: 'est-storage',
          text: 'A hundred million posts a day at, say, a kilobyte each is a hundred gigabytes a day, or about thirty-six terabytes a year.',
          quality: 'weak',
          scores: { estimation: -1 },
          reaction:
            'That is affordable and it is not the constraint. What is expensive here?',
          coaching:
            'Storage for the posts themselves is never the hard part of a feed. The cost is the fanout - how many timeline entries one post generates - and the read rate. Estimate the thing that decides the architecture, not the thing that is easy to compute.',
          concepts: ['back-of-envelope'],
        },
      ],
    },

    {
      id: 'estimate-help',
      kind: 'estimate',
      prompt:
        'Let me narrow it. Twelve hundred posts a second, and the median account has two hundred followers. If every follower gets their own copy of the post, how many writes is that?',
      next: 'fanout',
      choices: [
        {
          id: 'help-good',
          text: 'Twelve hundred times two hundred, so about a quarter of a million timeline writes a second, against twelve hundred original posts. The write amplification is two hundred to one.',
          quality: 'strong',
          scores: { estimation: 2, scalability: 1 },
          reaction:
            'Exactly. Hold on to that number - it is what makes the tail terrifying.',
          coaching:
            'Write amplification is the concept: one logical write becomes many physical ones. Naming the ratio makes the celebrity problem obvious before anyone asks about it.',
          concepts: ['fanout-on-write', 'write-amplification'],
        },
        {
          id: 'help-adequate',
          text: 'A lot more than twelve hundred - it scales with the number of followers, so every post becomes hundreds of writes.',
          quality: 'adequate',
          scores: { estimation: 1 },
          reaction:
            'Right shape. Put a number on it and it will do more work for you later.',
          coaching:
            'The intuition is correct. Interviews reward the arithmetic being spoken aloud, because a specific number is what lets you reject an option later without hand-waving.',
          concepts: ['fanout-on-write'],
        },
      ],
    },

    {
      id: 'fanout',
      kind: 'design',
      prompt: 'So how does a post reach a timeline? Be concrete about when the work happens.',
      next: 'celebrity',
      choices: [
        {
          id: 'fanout-write',
          text: 'Fanout on write. When someone posts, a worker looks up their followers and appends a reference to each follower timeline, which is a per-user list capped at a few hundred entries. Reading a timeline is then one lookup by user id and no merging at all. The post body lives once in a posts table; the timeline holds ids, so an edit or a delete does not have to rewrite millions of rows.',
          quality: 'strong',
          scores: { architecture: 2, 'data-modelling': 2, scalability: 1 },
          reaction:
            'Good, and storing ids rather than copies is the right call. Now the account with a hundred million followers posts.',
          coaching:
            'Two decisions worth stating explicitly: the work moves to write time because reads outnumber writes fifty to one, and the timeline holds references rather than denormalised copies so that mutating a post stays cheap.',
          concepts: ['fanout-on-write', 'denormalisation', 'cqrs'],
        },
        {
          id: 'fanout-read',
          text: 'Fanout on read. Store posts once, and when a user opens the app, fetch the recent posts from each account they follow and merge them by timestamp. Nothing is duplicated and a new follow takes effect immediately.',
          quality: 'adequate',
          scores: { architecture: 0, scalability: -1, 'trade-offs': 1 },
          reaction:
            'A user following two thousand accounts, at two hundred thousand reads a second. How many partition reads is that, and what is the tail latency?',
          coaching:
            'Not wrong so much as pointed the wrong way for this ratio. Read-time merge is the right answer when writes vastly outnumber reads or when timelines are rarely viewed; here reads dominate fifty to one, so the work belongs at write time for almost everyone.',
          concepts: ['fanout-on-read', 'cross-shard-query', 'tail-latency'],
        },
        {
          id: 'fanout-copy',
          text: 'Fanout on write, and copy the full post text into every follower timeline so a read needs no joins at all.',
          quality: 'weak',
          scores: { 'data-modelling': -2, 'trade-offs': -1 },
          reaction:
            'Someone edits a post that went to forty million timelines. Or deletes it. What do you do?',
          coaching:
            'Denormalising the body turns every edit and every deletion into a forty-million-row update, and a deletion that is slow is a legal problem rather than a performance one. Fan out the reference; hydrate the body at read time from a cache.',
          concepts: ['denormalisation', 'write-amplification', 'cache-generic'],
        },
      ],
    },

    {
      id: 'celebrity',
      kind: 'pressure',
      prompt:
        'An account with a hundred million followers posts. Under your design that is a hundred million timeline writes for one action. Walk me through it.',
      next: 'ordering',
      choices: [
        {
          id: 'celeb-hybrid',
          text: 'You do not fan that out. Above a threshold - say a hundred thousand followers - the account is marked as large and its posts are not pushed anywhere. At read time, a timeline is the precomputed list merged with a small query against the handful of large accounts that user follows. Almost nobody follows more than a few dozen of those, so the merge is tiny and bounded, and we get the write savings where they matter without giving up the fast read path for everyone else.',
          quality: 'strong',
          scores: { architecture: 2, scalability: 2, 'trade-offs': 2 },
          reaction:
            'That is the answer. What does the threshold cost you when an account crosses it?',
          coaching:
            'The hybrid is the expected destination, and the reason it works is asymmetry: there are very few large accounts, so the read-time merge stays small even though the write-time saving is enormous. Naming the threshold as a tunable rather than a constant is what separates this from a memorised answer.',
          concepts: ['fanout-on-write', 'fanout-on-read', 'hot-key', 'key-splitting'],
        },
        {
          id: 'celeb-async',
          text: 'Push the fanout onto a queue and process it asynchronously with many workers, so the post returns immediately and the writes drain over the next few minutes.',
          quality: 'adequate',
          scores: { architecture: 1, scalability: 0, reliability: 1 },
          reaction:
            'It still costs a hundred million writes, they just arrive later. If ten such accounts post in the same minute, what is the backlog?',
          coaching:
            'Asynchrony is necessary and not sufficient. It fixes the latency of the posting action and does nothing about the total work, so a burst of large accounts still saturates the pipeline and delays everybody else’s ordinary posts behind it.',
          concepts: ['queue-depth', 'backpressure', 'head-of-line-blocking'],
        },
        {
          id: 'celeb-shard',
          text: 'Shard the fanout workers by follower id so the hundred million writes spread evenly across the cluster and no single worker is a bottleneck.',
          quality: 'weak',
          scores: { scalability: -1, 'trade-offs': -1 },
          reaction:
            'The writes are spread and there are still a hundred million of them. Have you reduced any work?',
          coaching:
            'Parallelising work you should not be doing is the classic wrong turn here. The insight is not to distribute the hundred million writes better but to not perform them, which only becomes visible once you ask what a read would cost instead.',
          concepts: ['sharding', 'partition-key'],
        },
      ],
    },

    {
      id: 'ordering',
      kind: 'deepen',
      prompt:
        'Product wants a ranked timeline rather than reverse-chronological. What breaks?',
      next: 'lag',
      choices: [
        {
          id: 'rank-good',
          text: 'Ranking breaks the assumption that the timeline is an append-only list, because a post’s position now depends on signals that change after it was written. I would keep the precomputed list as a candidate set - still fanout, still cheap - and rank at read time over the most recent few hundred candidates, with the scores cached briefly per user. That keeps the expensive part bounded and means a change to the ranking model does not require rewriting hundreds of millions of stored timelines.',
          quality: 'strong',
          scores: { architecture: 2, 'trade-offs': 2, adaptability: 2 },
          reaction:
            'Good. Ranking at read time over a precomputed candidate set is what most large systems settle on.',
          coaching:
            'The separation to name is candidate generation from ranking. Fanout produces candidates cheaply; ranking is applied late over a small window, so model changes are a deploy rather than a migration.',
          concepts: ['cqrs', 'cache-generic', 'expand-contract'],
        },
        {
          id: 'rank-store',
          text: 'Store the score alongside each timeline entry at fanout time and keep the list sorted by score instead of by time.',
          quality: 'adequate',
          scores: { architecture: 0, adaptability: -1 },
          reaction:
            'The model changes on Tuesday. What do you do with the scores you wrote on Monday?',
          coaching:
            'Materialising the score at write time makes reads trivial and welds every stored timeline to one version of the model. Ranking signals change far more often than posts do, which is the argument for computing them late.',
          concepts: ['denormalisation', 'versioning'],
        },
        {
          id: 'rank-ignore',
          text: 'Rank the whole timeline on every read, scoring all the posts from everyone the user follows.',
          quality: 'weak',
          scores: { scalability: -2, 'trade-offs': -1 },
          reaction:
            'At two hundred thousand reads a second, across every post from two thousand accounts. What is that costing?',
          coaching:
            'Unbounded work on the read path at this rate is the failure the whole design has been avoiding. Ranking must operate over a bounded candidate set, which is precisely what the precomputed timeline provides.',
          concepts: ['tail-latency', 'load-shedding'],
        },
      ],
    },

    {
      id: 'lag',
      kind: 'failure',
      prompt:
        'The fanout workers fall an hour behind during a spike. Nothing is erroring. What does a user see, and what do you do?',
      next: 'storage',
      choices: [
        {
          id: 'lag-good',
          text: 'They see a timeline that is stale rather than broken, which is why nothing alerts: every component reports success. The signal to monitor is queue lag, not error rate. To degrade well I would prioritise the queue - a user’s own posts fan out first so they always see their own writes, which is the staleness people actually notice - and shed or defer the lowest-value work, like fanning out to accounts that have not opened the app in weeks.',
          quality: 'strong',
          scores: { 'failure-handling': 2, reliability: 2, 'consistency': 1 },
          reaction:
            'Read-your-own-writes is exactly the thing users notice. Good.',
          coaching:
            'Two strong moves: alerting on lag rather than errors, because this failure is silent, and identifying which staleness is visible. A user tolerates a friend’s post arriving late and immediately reports their own missing post as a bug.',
          concepts: ['queue-depth', 'read-your-writes', 'staleness', 'load-shedding'],
        },
        {
          id: 'lag-scale',
          text: 'Autoscale the worker pool on queue depth so capacity grows when the backlog does.',
          quality: 'adequate',
          scores: { reliability: 1, 'failure-handling': 0 },
          reaction:
            'Helpful, and it takes minutes to take effect. What does the user see in the meantime, and which work would you rather drop?',
          coaching:
            'Scaling is the right long-run answer and does nothing for the next five minutes. An interviewer is looking for graceful degradation - what you sacrifice deliberately - alongside the capacity response.',
          concepts: ['autoscaling', 'capacity-headroom', 'graceful-degradation'],
        },
        {
          id: 'lag-nothing',
          text: 'The queue will drain once the spike passes, so as long as nothing is failing we let it catch up.',
          quality: 'weak',
          scores: { 'failure-handling': -2, reliability: -1 },
          reaction:
            'It has been ninety minutes and the backlog is still growing. Was it going to drain?',
          coaching:
            'A backlog that grows faster than it drains never recovers on its own, and the absence of errors is what makes this dangerous rather than reassuring. Silent lag needs an alert and a deliberate shedding plan before it happens.',
          concepts: ['backpressure', 'queue-depth', 'cascading-failure'],
        },
      ],
    },

    {
      id: 'storage',
      kind: 'tradeoff',
      prompt:
        'Five hundred million users with a stored timeline each. How big is that, and what would you cut first?',
      next: 'wrap',
      choices: [
        {
          id: 'storage-good',
          text: 'Cap each timeline at, say, eight hundred entries. At sixteen bytes for a post id and a timestamp that is about thirteen kilobytes a user, so roughly six terabytes across five hundred million users - large but ordinary, and it fits in a distributed cache rather than needing disk. Anyone paging past the cap falls back to the read-time merge, which is slower and almost never happens. The first thing I would cut is timelines for accounts that have not opened the app in months: rebuild on demand rather than maintaining them.',
          quality: 'strong',
          scores: { 'data-modelling': 2, estimation: 2, 'trade-offs': 2 },
          reaction:
            'Good. Dormant users are usually the largest single saving in a feed system.',
          coaching:
            'Two things earn their keep here: the cap, which bounds storage and makes the fast path a fixed size, and the observation that a large fraction of accounts are inactive and being maintained for nobody.',
          concepts: ['retention', 'cache-generic', 'cost', 'capacity-headroom'],
        },
        {
          id: 'storage-cap',
          text: 'Cap the timelines at a few hundred entries and trim on write. Beyond that, users can page into a slower path.',
          quality: 'adequate',
          scores: { 'data-modelling': 1, 'trade-offs': 1 },
          reaction:
            'Sensible. Roughly how much storage does that leave you with?',
          coaching:
            'The right mechanism without the number. Interviews reward closing the loop: a cap is only obviously correct once you have shown what it costs in total.',
          concepts: ['retention', 'ttl'],
        },
        {
          id: 'storage-unbounded',
          text: 'Keep the full history in each timeline so users can scroll back indefinitely without hitting a different code path.',
          quality: 'weak',
          scores: { 'data-modelling': -2, 'trade-offs': -2 },
          reaction:
            'Five hundred million users times years of posts from everyone they follow. What is that number?',
          coaching:
            'Unbounded per-user materialised history multiplies the corpus by the average follower count and grows forever. Deep history is a query against the posts themselves, which is rare enough to be slow.',
          concepts: ['write-amplification', 'cost', 'retention'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      prompt:
        'Last one. Tomorrow morning, how would you know this system is failing the users rather than failing the dashboards?',
      choices: [
        {
          id: 'wrap-good',
          text: 'The characteristic failure here is silent, so I would not watch error rates. I would watch fanout lag as a distribution rather than a mean, because the tail is where a hot account hides; the age of the newest post in a sampled set of real timelines, which is the closest thing to what a user actually experiences; and read-your-own-writes latency specifically, since that is the staleness people report. I would also alert on the number of accounts crossing the large-account threshold, because that boundary silently changes which path a post takes.',
          quality: 'strong',
          scores: { reliability: 2, 'failure-handling': 2, communication: 2 },
          reaction:
            'Sampling real timelines is the one most people miss. Good.',
          coaching:
            'The instinct to name is measuring the user’s experience rather than the components: every service can report success while every timeline is an hour stale. Watching the threshold crossings is a nice touch, because that is a change in behaviour with no deploy attached to it.',
          concepts: ['observability', 'alerting', 'tail-latency', 'staleness'],
        },
        {
          id: 'wrap-adequate',
          text: 'Monitor queue depth and worker throughput, and alert when the backlog grows for a sustained period.',
          quality: 'adequate',
          scores: { reliability: 1, 'failure-handling': 1 },
          reaction: 'That catches the big one. What would it miss?',
          coaching:
            'Queue depth is the right primary signal. It will miss a single hot partition whose lag is invisible in an aggregate, and it does not tell you what a user is seeing - which is why sampling real timelines is worth adding.',
          concepts: ['queue-depth', 'alerting'],
        },
      ],
    },
  ],
};
