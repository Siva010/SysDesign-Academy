/**
 * Node-only content loading. Reads MDX from `content/`, validates frontmatter, and caches.
 *
 * Never import this from a client component. The app imports it in server components and
 * in `scripts/validate-content.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import type { CaseStudy, Failure, Lesson, Pattern } from './types';

const CONTENT_ROOT = path.join(process.cwd(), 'content');

const difficulty = z.enum(['intro', 'core', 'advanced', 'staff']);
const status = z.enum(['stub', 'draft', 'reviewed']);
const ids = z.array(z.string()).default([]);

const lessonFrontmatter = z.object({
  id: z.string(),
  title: z.string(),
  level: z.number().int().min(0).max(8),
  module: z.string(),
  order: z.number().int().min(1),
  summary: z.string(),
  difficulty,
  minutes: z.number().int().min(1).max(180),
  prerequisites: ids,
  concepts: ids,
  unlocks: ids,
  patterns: ids.optional(),
  failures: ids.optional(),
  caseStudies: ids.optional(),
  sources: ids,
  status,
  prereqOverride: z.string().optional(),
});

const patternFrontmatter = z.object({
  id: z.string(),
  title: z.string(),
  problem: z.string(),
  category: z.enum(['caching', 'data', 'messaging', 'resilience', 'scaling', 'deployment', 'consistency']),
  concepts: ids,
  relatedPatterns: ids.optional(),
  alsoKnownAs: z.array(z.string()).optional(),
  seenIn: z.array(z.string()).optional(),
  sources: ids,
  status,
});

const caseStudyFrontmatter = z.object({
  id: z.string(),
  title: z.string(),
  ask: z.string(),
  difficulty,
  minutes: z.number().int().min(1).max(400),
  signatures: z.array(
    z.enum([
      'id-generation',
      'fanout',
      'hot-key',
      'exactly-once-effect',
      'geo-index',
      'large-object',
      'time-series-ingest',
      'search-index',
      'scheduling',
      'inventory-contention',
      'stream-join',
    ]),
  ),
  concepts: ids,
  patterns: ids,
  prerequisites: ids,
  sources: ids,
  status,
});

const failureFrontmatter = z.object({
  id: z.string(),
  title: z.string(),
  symptom: z.string(),
  category: z.enum(['overload', 'latency', 'data', 'coordination', 'dependency', 'deployment', 'capacity']),
  concepts: ids,
  sources: ids,
  status,
});

/** Recursively collect .mdx files under a directory. Returns [] if the directory is absent. */
function mdxFiles(dir: string): string[] {
  const root = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.mdx')) out.push(full);
    }
  };
  walk(root);
  return out.sort();
}

function parse<S extends z.ZodTypeAny>(file: string, schema: S): { data: z.infer<S>; body: string } {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);

  let data: Record<string, unknown>;
  let content: string;
  try {
    ({ data, content } = matter(raw) as { data: Record<string, unknown>; content: string });
  } catch (cause) {
    /*
     * The commonest cause by far is an unquoted colon-space inside a frontmatter value,
     * which YAML reads as a nested mapping. The raw parser error is unreadable, so say
     * what actually went wrong.
     */
    const message = cause instanceof Error ? cause.message.split('\n')[0] : String(cause);
    throw new Error(
      `Invalid YAML frontmatter in ${rel} - ${message}. ` +
        'A common cause is an unquoted ": " inside a value; wrap the value in quotes or rephrase it.',
    );
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid frontmatter in ${path.relative(process.cwd(), file)} - ${issues}`);
  }
  return { data: result.data, body: content.trim() };
}

/* ---------------------------------------------------------------- caches */

let lessonCache: Lesson[] | null = null;
let patternCache: Pattern[] | null = null;
let caseStudyCache: CaseStudy[] | null = null;
let failureCache: Failure[] | null = null;

export function loadAllLessons(): Lesson[] {
  if (lessonCache) return lessonCache;
  lessonCache = mdxFiles('lessons').map((file) => {
    const { data, body } = parse(file, lessonFrontmatter);
    return {
      ...data,
      patterns: data.patterns ?? [],
      failures: data.failures ?? [],
      caseStudies: data.caseStudies ?? [],
      slug: data.id,
      body,
      filePath: path.relative(process.cwd(), file),
    };
  });
  return lessonCache;
}

export function loadAllPatterns(): Pattern[] {
  if (patternCache) return patternCache;
  patternCache = mdxFiles('patterns').map((file) => {
    const { data, body } = parse(file, patternFrontmatter);
    return { ...data, slug: data.id, body, filePath: path.relative(process.cwd(), file) };
  });
  return patternCache;
}

export function loadAllCaseStudies(): CaseStudy[] {
  if (caseStudyCache) return caseStudyCache;
  caseStudyCache = mdxFiles('case-studies').map((file) => {
    const { data, body } = parse(file, caseStudyFrontmatter);
    return { ...data, slug: data.id, body, filePath: path.relative(process.cwd(), file) };
  });
  return caseStudyCache;
}

export function loadAllFailures(): Failure[] {
  if (failureCache) return failureCache;
  failureCache = mdxFiles('failures').map((file) => {
    const { data, body } = parse(file, failureFrontmatter);
    return { ...data, slug: data.id, body, filePath: path.relative(process.cwd(), file) };
  });
  return failureCache;
}

/* ---------------------------------------------------------------- lookups */

export function getLesson(id: string): Lesson | undefined {
  return loadAllLessons().find((l) => l.id === id);
}

export function getPattern(id: string): Pattern | undefined {
  return loadAllPatterns().find((p) => p.id === id);
}

export function getCaseStudy(id: string): CaseStudy | undefined {
  return loadAllCaseStudies().find((c) => c.id === id);
}

export function getFailure(id: string): Failure | undefined {
  return loadAllFailures().find((f) => f.id === id);
}

export function lessonsForModule(moduleId: string): Lesson[] {
  return loadAllLessons()
    .filter((l) => l.module === moduleId)
    .sort((a, b) => a.order - b.order);
}

export function lessonsForLevel(level: number): Lesson[] {
  return loadAllLessons()
    .filter((l) => l.level === level)
    .sort((a, b) => a.order - b.order);
}

/** Every lesson that teaches or unlocks a concept. Powers the concept pages. */
export function lessonsTeaching(conceptId: string): Lesson[] {
  return loadAllLessons().filter((l) => l.concepts.includes(conceptId));
}

/** Curriculum order across the whole course: level, then module order, then lesson order. */
export function orderedLessons(moduleOrder: Record<string, number>): Lesson[] {
  return [...loadAllLessons()].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    const ma = moduleOrder[a.module] ?? 999;
    const mb = moduleOrder[b.module] ?? 999;
    if (ma !== mb) return ma - mb;
    return a.order - b.order;
  });
}
