import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The interview method',
  description:
    'A repeatable way to attack a system design question you have never seen, and how to hold it without sounding like a script.',
};

const STEPS = [
  {
    n: 1,
    name: 'Frame',
    minutes: '3–5 min',
    goal: 'Turn a vague prompt into a bounded problem.',
    doing:
      'Ask the questions whose answers would change the design. Who uses it, how many, what is the read/write ratio, what latency is acceptable, what must never be lost, what may be stale, where are the users, what is out of scope.',
    tell: 'Say which answers you are assuming when the interviewer will not commit, and write them down.',
    failure:
      'Asking questions whose answers change nothing. "What language should I use?" tells the interviewer you are filling time.',
  },
  {
    n: 2,
    name: 'Size',
    minutes: '3–5 min',
    goal: 'Get the order of magnitude that decides the architecture.',
    doing:
      'Users to requests per second, peak factor, read/write split, data per day and per year, working set. Stop as soon as the numbers stop changing your decisions.',
    tell: 'Say the assumption before the arithmetic. The interviewer can correct an assumption; they cannot correct a number.',
    failure:
      'Computing storage to three significant figures, then designing as though the number had not been computed.',
  },
  {
    n: 3,
    name: 'Model',
    minutes: '5 min',
    goal: 'Name the entities and, more importantly, the access patterns.',
    doing:
      'What is written, what is read, by which key, how often, and in what order. The access patterns choose the storage; the entities rarely do.',
    tell: 'State the one or two queries that dominate. Those are what the design has to be good at.',
    failure:
      'Drawing an entity-relationship diagram that would be identical for any product in the category.',
  },
  {
    n: 4,
    name: 'Design the simple thing',
    minutes: '5–8 min',
    goal: 'A complete system that satisfies the stated requirements, and nothing more.',
    doing:
      'Client, service, storage. Say what each component is for. Resist adding a queue, a cache or a second service until something forces it.',
    tell: 'Say explicitly that this is the simplest version and that you expect to evolve it. That is a signal of seniority, not of inexperience.',
    failure:
      'Opening with a diagram containing Kafka, Redis, a CDN and six services before anyone has said how many users there are.',
  },
  {
    n: 5,
    name: 'Find the bottleneck',
    minutes: '5 min',
    goal: 'Apply your own numbers to your own design and find where it breaks first.',
    doing:
      'Walk the peak numbers through each component. Which one saturates first? Fix that one, then look again. Repeat until nothing obvious remains.',
    tell: 'Narrate the search, not just the answer. "At 40,000 reads per second the primary is the constraint, so the question is caching or replicas."',
    failure:
      'Adding components in a fixed order learned from a video, rather than in the order the numbers demand.',
  },
  {
    n: 6,
    name: 'Break it',
    minutes: '5 min',
    goal: 'Show what happens when each part disappears.',
    doing:
      'Remove the cache, the queue, a region, a dependency. Say what the user experiences and what the system does. Name the mitigation and its cost.',
    tell: 'Volunteer this before you are asked. Candidates who bring up failure unprompted are rare and remembered.',
    failure:
      'Claiming a component "just fails over" without saying who detects the failure, how long it takes, and what is lost in the window.',
  },
  {
    n: 7,
    name: 'Defend the trade-offs',
    minutes: 'ongoing',
    goal: 'Show that every choice was a choice.',
    doing:
      'For each significant decision: what you chose, what you gave up, what would make you choose differently. Especially: under what conditions this design is wrong.',
    tell: 'Name the alternative you rejected and why. A decision with no rejected alternative was not a decision.',
    failure:
      'Defending a choice as though it were free. Every architecture is worse at something; not knowing at what is the tell.',
  },
];

const PRESSURE = [
  {
    move: 'Raising the scale',
    example: '"Now it is 100 times bigger."',
    response:
      'Do not restart. Identify which component saturates first at the new number, change that, and say what new problem the change introduced.',
  },
  {
    move: 'Removing a component',
    example: '"The cache is down."',
    response:
      'State the immediate consequence in load terms, not vibes: origin traffic goes from 5% of requests to 100%, which is 20 times its capacity. Then the mitigation: coalescing, shedding, and a cold-start plan.',
  },
  {
    move: 'Challenging a decision you made',
    example: '"Why not use a relational database for this?"',
    response:
      'Take the challenge seriously and answer on the merits. If they are right, say so and adjust — the ability to change your mind on evidence is being tested here, not your consistency.',
  },
  {
    move: 'Adding a conflicting requirement',
    example: '"It also has to be strongly consistent."',
    response:
      'Name the conflict explicitly and quantify what it costs. Then offer to apply the strong guarantee only where it is needed, rather than everywhere.',
  },
  {
    move: 'Silence',
    example: 'They stop responding and wait.',
    response:
      'Do not fill it by adding components. Summarise where you are, name the open question, and ask which part they want to go deeper on.',
  },
];

export default function MethodPage() {
  return (
    <div className="content-wide">
      <p className="eyebrow">Practice</p>
      <h1 className="page-title">The interview method</h1>
      <p className="page-lede">
        A repeatable order of operations for a question you have never seen. It is not a script
        to recite — reciting it is itself a failure mode — but a checklist you internalise until
        you notice yourself skipping a step.
      </p>

      <div className="callout callout-info">
        <div className="callout-title">The one-line version</div>
        <p style={{ marginBottom: 0 }}>
          <strong>
            Frame → Size → Model → Design the simple thing → Find the bottleneck → Break it →
            Defend the trade-offs.
          </strong>{' '}
          The last three are where most candidates are separated, and the first two are where
          most candidates lose time they needed for the last three.
        </p>
      </div>

      <section>
        <h2 className="section-title">The seven steps</h2>
        <div className="stack">
          {STEPS.map((s) => (
            <div key={s.n} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <span className="eyebrow">Step {s.n}</span>
                  <h3 style={{ margin: '0.25rem 0 0', fontSize: 'var(--text-md)' }}>{s.name}</h3>
                </div>
                <span className="chip">{s.minutes}</span>
              </div>
              <p className="constraint" style={{ margin: '0.5rem 0 0.75rem' }}>
                {s.goal}
              </p>
              <dl className="kv">
                <dt>What you do</dt>
                <dd>{s.doing}</dd>
                <dt>What you say</dt>
                <dd>{s.tell}</dd>
                <dt>How it goes wrong</dt>
                <dd className="muted">{s.failure}</dd>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Hidden requirements</h2>
        <p className="muted" style={{ maxWidth: '46rem' }}>
          Most prompts are underspecified on purpose. The gap between the words and the real
          problem is what is being tested. Some categories are almost always hiding something:
        </p>
        <div className="table-scroll" style={{ marginTop: '1rem' }}>
          <table className="block-table">
            <thead>
              <tr>
                <th style={{ width: '14rem' }}>If the prompt involves</th>
                <th>The unstated requirements are almost always</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Money moving</td>
                <td>
                  Duplicate prevention, idempotency, ordering, atomicity across systems,
                  reconciliation, auditability, and what happens when a downstream call times out
                  after the money left.
                </td>
              </tr>
              <tr>
                <td>Limited inventory</td>
                <td>
                  Concurrent buyers for the last unit, overselling versus underselling policy,
                  hold-then-confirm flows, and what happens when a hold expires mid-payment.
                </td>
              </tr>
              <tr>
                <td>A social feed</td>
                <td>
                  Extremely uneven follower counts, what may be stale and for how long, ranking
                  versus chronology, and deletion propagating to precomputed copies.
                </td>
              </tr>
              <tr>
                <td>Messaging or chat</td>
                <td>
                  Ordering within a conversation, delivery and read receipts, offline devices,
                  multi-device sync, and history retention.
                </td>
              </tr>
              <tr>
                <td>Uploads or media</td>
                <td>
                  Bytes never passing through your application, resumable uploads, virus and
                  content scanning, and the cost of egress.
                </td>
              </tr>
              <tr>
                <td>Anything public</td>
                <td>Abuse, scraping, rate limiting per identity, and who pays when it is attacked.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="section-title">Handling pressure</h2>
        <p className="muted" style={{ maxWidth: '46rem' }}>
          Escalation is not an attack. It is how the interviewer finds the edge of your
          understanding, which is the entire purpose of the exercise. The correct instinct is
          always to <strong>evolve the design, not restart it</strong>.
        </p>
        <div className="stack" style={{ marginTop: '1rem' }}>
          {PRESSURE.map((p) => (
            <div key={p.move} className="card">
              <strong>{p.move}</strong>
              <p
                className="constraint"
                style={{ margin: '0.35rem 0 0.5rem', fontStyle: 'italic' }}
              >
                {p.example}
              </p>
              <p className="small" style={{ margin: 0 }}>
                {p.response}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Recovering from a bad start</h2>
        <div className="stack">
          <div className="card">
            <strong>You realise your data model cannot answer the main query.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              Say it out loud, name what forced the change, and fix it. &ldquo;My partition key
              makes the timeline query a scatter-gather across every shard. That is the dominant
              read, so the key is wrong — it should be user and time.&rdquo; This reads as
              competence. Quietly hoping nobody noticed does not.
            </p>
          </div>
          <div className="card">
            <strong>You have designed something far more complex than the requirements need.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              Delete components in front of them. &ldquo;At 200 writes per second none of this is
              necessary. Let me take the queue and the shards out and keep a single primary with
              a read replica.&rdquo; Simplifying under your own initiative is a strong signal.
            </p>
          </div>
          <div className="card">
            <strong>You do not know something.</strong>
            <p className="small muted" style={{ margin: '0.35rem 0 0' }}>
              Say so, then reason. &ldquo;I have not operated one at that scale. From first
              principles I would expect the constraint to be X, because Y.&rdquo; Interviewers
              can tell the difference between a gap and a bluff, and only one of them is
              disqualifying.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Where to practise this</h2>
        <div className="row">
          <Link href="/interview" className="btn btn-primary">
            Interview simulator
          </Link>
          <Link href="/case-studies" className="btn">
            Worked case studies
          </Link>
          <Link href="/estimate" className="btn">
            Estimation toolkit
          </Link>
        </div>
      </section>
    </div>
  );
}
