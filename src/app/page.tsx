import Link from 'next/link';
import { LEVELS } from '@/content/curriculum';
import { CONCEPTS } from '@/content/concepts';
import { DECISIONS } from '@/content/decisions';
import { LEVEL_CONCEPTS } from '@/content/level-concepts';
import {
  lessonIndex,
  loadAllCaseStudies,
  loadAllFailures,
  loadAllLessons,
  loadAllPatterns,
} from '@/lib/content-node';
import { lessonsByLevel } from '@/lib/lesson-index';
import { LevelProgress } from '@/components/LevelProgress';

export default function HomePage() {
  const byLevel = lessonsByLevel(lessonIndex());
  const lessons = loadAllLessons();
  const patterns = loadAllPatterns();
  const caseStudies = loadAllCaseStudies();
  const failures = loadAllFailures();

  const start = lessons
    .slice()
    .sort((a, b) => a.level - b.level || a.order - b.order)
    .find((l) => l.level === 0);

  return (
    <div className="content-wide">
      <div style={{ maxWidth: '46rem' }}>
        <p className="eyebrow">A system design curriculum</p>
        <h1 className="page-title" style={{ fontSize: '2.6rem', lineHeight: 1.15 }}>
          Learn to derive designs, not to memorise them.
        </h1>
        <p className="page-lede">
          Every idea here arrives because something broke. A single server runs out of cores; a
          cache goes cold and takes the database with it; two machines disagree about who is the
          leader. The technology is always the answer to a question, and the question comes first.
        </p>

        <div className="row" style={{ marginBottom: '2.5rem' }}>
          {start && (
            <Link href={`/lessons/${start.id}`} className="btn btn-primary">
              Start at the beginning
            </Link>
          )}
          <Link href="/next" className="btn">
            I already know some of this
          </Link>
          <Link href="/method" className="btn">
            Interview method
          </Link>
        </div>
      </div>

      <section>
        <h2 className="section-title">The ladder</h2>
        <p className="muted" style={{ maxWidth: '46rem' }}>
          Nine levels, each defined by the constraint that dominates it. Each one ends with a
          system that works, and then breaks in the way that motivates the next.
        </p>
        <div className="stack" style={{ marginTop: '1.5rem' }}>
          {LEVELS.map((level) => (
            <Link key={level.id} href={`/levels/${level.index}`} className="level-card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: '16rem' }}>
                  <span className="eyebrow">Level {level.index}</span>
                  <h3>{level.name}</h3>
                  <p className="constraint" style={{ margin: 0 }}>
                    {level.constraint}
                  </p>
                </div>
                <LevelProgress lessons={byLevel.get(level.index) ?? []} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">What is in here</h2>
        <div className="card-grid">
          <Link href="/concepts" className="card level-card">
            <strong>{CONCEPTS.length} concepts</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              A graph, not a glossary. Every concept links to what it requires, what it makes
              possible, and — most usefully — what it trades against.
            </p>
          </Link>
          <Link href="/case-studies" className="card level-card">
            <strong>{caseStudies.length} case studies</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              Derivations with escalating interviewer pressure. Indexed by the primitive problem
              underneath, so an unfamiliar prompt becomes a familiar one.
            </p>
          </Link>
          <Link href="/patterns" className="card level-card">
            <strong>{patterns.length} patterns</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              Each with the section most pattern libraries omit: when not to use it.
            </p>
          </Link>
          <Link href="/failures" className="card level-card">
            <strong>{failures.length} failure walkthroughs</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              Retry storms, cache stampedes, split brain. Told as incidents, because that is how
              you will meet them.
            </p>
          </Link>
          <Link href="/decisions" className="card level-card">
            <strong>{DECISIONS.length} decision tables</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              Constraint, consequence, choice. Not pros and cons — you cannot pick an architecture
              by counting bullet points.
            </p>
          </Link>
          <Link href="/estimate" className="card level-card">
            <strong>Estimation toolkit</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              Every assumption visible and adjustable, so you can ask the only question that
              matters: does 10x here change the design?
            </p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="section-title">How this is built</h2>
        <div style={{ maxWidth: '46rem' }} className="stack">
          <div className="card">
            <strong>Claims carry their evidence</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              Every non-obvious statement is labelled: documented fact, industry convention,
              our recommendation, a deliberate simplification, an inference, or speculation.
              Facts cite a primary source. Company architectures are never invented, and case
              studies say plainly that they are pedagogical approximations.{' '}
              <Link href="/sources">See the source hierarchy</Link>.
            </p>
          </div>
          <div className="card">
            <strong>Numbers are assumptions, not folklore</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              No invented benchmarks. Where a figure appears, it is either cited with a date,
              a physical constant, or an assumption you can change and re-derive.
            </p>
          </div>
          <div className="card">
            <strong>Progress is what you did, not what we guessed</strong>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              You mark a lesson read; nothing infers a skill level from how you answered a
              question. Each pass has a different job, and things come back on an expanding
              interval so a second read lands when it is worth something.{' '}
              <Link href="/progress">See how progress works</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
