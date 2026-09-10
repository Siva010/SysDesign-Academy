import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LevelProgress } from '@/components/LevelProgress';
import { ReadMark } from '@/components/ReadMark';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { LEVELS, LEVEL_BY_INDEX, modulesForLevel } from '@/content/curriculum';
import { LEVEL_CONCEPTS } from '@/content/level-concepts';
import { lessonIndex, lessonsForModule, loadAllCaseStudies } from '@/lib/content-node';

export function generateStaticParams() {
  return LEVELS.map((l) => ({ level: String(l.index) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string }>;
}): Promise<Metadata> {
  const { level } = await params;
  const l = LEVEL_BY_INDEX[Number(level)];
  if (!l) return { title: 'Level not found' };
  return { title: `Level ${l.index}: ${l.name}`, description: l.outcome };
}

export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level: levelParam } = await params;
  const level = LEVEL_BY_INDEX[Number(levelParam)];
  if (!level) notFound();

  const modules = modulesForLevel(level.index);
  const caseStudies = loadAllCaseStudies();
  const concepts = LEVEL_CONCEPTS[level.index] ?? [];
  const nextLevel = LEVEL_BY_INDEX[level.index + 1];

  return (
    <div className="content-wide">
      <div>
        <p className="eyebrow">Level {level.index}</p>
        <h1 className="page-title">{level.name}</h1>

        <dl className="kv" style={{ marginBottom: '2rem' }}>
          <dt>Dominant constraint</dt>
          <dd>{level.constraint}</dd>
          <dt>You will be able to</dt>
          <dd>{level.outcome}</dd>
          <dt>Then it breaks</dt>
          <dd className="muted">{level.breaksBecause}</dd>
        </dl>

        <LevelProgress lessons={lessonIndex().filter((l) => l.level === level.index)} />
      </div>

      <section>
        <h2 className="section-title">Modules</h2>
        <div className="stack">
          {modules.map((mod) => {
            const lessons = lessonsForModule(mod.id);
            return (
              <div key={mod.id} className="card">
                <div className="eyebrow">{mod.name}</div>
                <p className="constraint" style={{ margin: '0.35rem 0 1rem' }}>
                  {mod.question}
                </p>

                {mod.library === 'case-studies' ? (
                  <div className="list-rows">
                    {caseStudies.map((study) => (
                      <Link
                        key={study.id}
                        href={`/case-studies/${study.id}`}
                        className="list-row"
                      >
                        <div className="list-row-head">
                          <ReadMark kind="case-study" id={study.id} />
                          <span className="list-row-title">{study.title}</span>
                          <span className="chip">{study.difficulty}</span>
                          <span className="tiny faint">{study.minutes} min</span>
                        </div>
                        <div className="list-row-summary">{study.ask}</div>
                      </Link>
                    ))}
                  </div>
                ) : lessons.length === 0 ? (
                  <p className="small faint" style={{ margin: 0 }}>
                    No lessons written for this module yet.
                  </p>
                ) : (
                  <div className="list-rows">
                    {lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className={`list-row${lesson.status === 'stub' ? ' status-stub' : ''}`}
                      >
                        <div className="list-row-head">
                          <ReadMark kind="lesson" id={lesson.id} />
                          <span className="list-row-title">{lesson.title}</span>
                          <span className="tiny faint">{lesson.minutes} min</span>
                          {lesson.status !== 'reviewed' && (
                            <span className="chip chip-warn">{lesson.status}</span>
                          )}
                        </div>
                        <div className="list-row-summary">{lesson.summary}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">Concepts this level owns</h2>
        <p className="muted small">
          Progress for this level is measured against these. Each concept belongs to exactly one
          level, so percentages across levels are comparable.
        </p>
        <div className="chip-row" style={{ marginTop: '1rem' }}>
          {concepts.map((id) => {
            const c = CONCEPT_BY_ID[id];
            if (!c) return null;
            return (
              <Link key={id} href={`/concepts/${id}`} className="chip" title={c.oneLiner}>
                {c.name}
              </Link>
            );
          })}
        </div>
      </section>

      {nextLevel && (
        <nav className="lesson-nav" aria-label="Level navigation">
          <span />
          <Link href={`/levels/${nextLevel.index}`} className="next">
            <span className="dir">Next level</span>
            {nextLevel.index}. {nextLevel.name}
          </Link>
        </nav>
      )}
    </div>
  );
}
