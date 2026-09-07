import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { extractHeadings } from '@/components/mdx';
import { LessonFooter } from '@/components/LessonFooter';
import { PrerequisiteCheck } from '@/components/PrerequisiteCheck';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { LEVEL_BY_INDEX, MODULES, MODULE_BY_ID } from '@/content/curriculum';
import { getSource } from '@/content/sources';
import { getFailure, getLesson, getPattern, loadAllLessons, orderedLessons } from '@/lib/content-node';
import { Mdx } from '@/lib/mdx';

const MODULE_ORDER: Record<string, number> = Object.fromEntries(
  MODULES.map((m) => [m.id, m.order]),
);

export function generateStaticParams() {
  return loadAllLessons().map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) return { title: 'Lesson not found' };
  return { title: lesson.title, description: lesson.summary };
}

const DIFFICULTY_LABEL: Record<string, string> = {
  intro: 'Intro',
  core: 'Core',
  advanced: 'Advanced',
  staff: 'Staff-level',
};

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  const level = LEVEL_BY_INDEX[lesson.level];
  const mod = MODULE_BY_ID[lesson.module];
  const headings = extractHeadings(lesson.body);

  const ordered = orderedLessons(MODULE_ORDER);
  const index = ordered.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? ordered[index - 1] : undefined;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined;

  const taught = lesson.concepts
    .map((c) => CONCEPT_BY_ID[c])
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const unlocked = lesson.unlocks
    .map((c) => CONCEPT_BY_ID[c])
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  /* Frontmatter cross-links. A lesson that names a failure is claiming this is how the idea
     goes wrong in production, which is worth one click rather than a search. */
  const relatedPatterns = (lesson.patterns ?? [])
    .map((id) => getPattern(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const relatedFailures = (lesson.failures ?? [])
    .map((id) => getFailure(id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <div className="with-rail">
      <article>
        <header className="lesson-header">
          <div className="eyebrow">
            <Link href={`/levels/${lesson.level}`}>
              Level {lesson.level} — {level?.name}
            </Link>
            {mod && <> · {mod.name}</>}
          </div>
          <h1 className="page-title">{lesson.title}</h1>
          <p className="page-lede" style={{ marginBottom: 0 }}>
            {lesson.summary}
          </p>
          <div className="lesson-meta">
            <span className="chip">{DIFFICULTY_LABEL[lesson.difficulty]}</span>
            <span>{lesson.minutes} min</span>
            <span>·</span>
            <span>{lesson.concepts.length} concepts</span>
            {lesson.status !== 'reviewed' && (
              <span className="chip chip-warn">{lesson.status}</span>
            )}
          </div>
        </header>

        <PrerequisiteCheck
          prerequisites={lesson.prerequisites}
          note={lesson.prereqOverride}
        />

        <div className="prose">
          <Mdx source={lesson.body} />
        </div>

        <LessonFooter lesson={lesson} />

        <nav className="lesson-nav" aria-label="Lesson navigation">
          {prev ? (
            <Link href={`/lessons/${prev.id}`}>
              <span className="dir">Previous</span>
              {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/lessons/${next.id}`} className="next">
              <span className="dir">Next</span>
              {next.title}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <aside className="rail">
        {headings.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">On this page</div>
            <ul className="rail-list">
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className={h.level === 3 ? 'indent' : undefined}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {taught.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Concepts taught</div>
            <ul className="rail-list">
              {taught.map((c) => (
                <li key={c.id}>
                  <Link href={`/concepts/${c.id}`} title={c.oneLiner}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {unlocked.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">This unlocks</div>
            <ul className="rail-list">
              {unlocked.map((c) => (
                <li key={c.id}>
                  <Link href={`/concepts/${c.id}`} title={c.oneLiner}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {relatedPatterns.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Patterns</div>
            <ul className="rail-list">
              {relatedPatterns.map((p) => (
                <li key={p.id}>
                  <Link href={`/patterns/${p.id}`} title={p.problem}>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {relatedFailures.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">When this breaks</div>
            <ul className="rail-list">
              {relatedFailures.map((f) => (
                <li key={f.id}>
                  <Link href={`/failures/${f.id}`} title={f.symptom}>
                    {f.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson.sources.length > 0 && (
          <div className="rail-section">
            <div className="rail-heading">Sources</div>
            <ul className="rail-list">
              {lesson.sources.map((s) => {
                const source = getSource(s);
                if (!source) return null;
                return (
                  <li key={s}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer noopener">
                        {source.title}
                      </a>
                    ) : (
                      <span className="muted">{source.title}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
