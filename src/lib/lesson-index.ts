/**
 * Views over the compact lesson index that client components need.
 *
 * These are the joins the old model avoided by storing per-concept state. Storing it meant two
 * facts that could disagree - a concept could be "understood" while every lesson teaching it was
 * unread - so it is derived here instead, from the one fact that is recorded.
 */
import type { LessonIndexEntry } from './types';
import { type PassRecord, conceptPasses, statusOf, urgency } from './passes';

/** Concept id to the lessons that teach it. */
export function lessonsByConcept(index: LessonIndexEntry[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const lesson of index) {
    for (const c of lesson.concepts) {
      const list = out.get(c);
      if (list) list.push(lesson.id);
      else out.set(c, [lesson.id]);
    }
  }
  return out;
}

export function lessonsByLevel(index: LessonIndexEntry[]): Map<number, LessonIndexEntry[]> {
  const out = new Map<number, LessonIndexEntry[]>();
  for (const lesson of index) {
    const list = out.get(lesson.level);
    if (list) list.push(lesson);
    else out.set(lesson.level, [lesson]);
  }
  return out;
}

export interface LevelStanding {
  total: number;
  read: number;
  /** Lessons read more than once. The curriculum is dense enough that once is a first look. */
  revisited: number;
  due: number;
  passes: number;
}

export function levelStanding(
  lessons: LessonIndexEntry[],
  records: Record<string, PassRecord>,
  now = Date.now(),
): LevelStanding {
  let read = 0;
  let revisited = 0;
  let due = 0;
  let passes = 0;
  for (const lesson of lessons) {
    const r = records[lesson.id];
    if (!r) continue;
    read++;
    passes += r.reads;
    if (r.reads > 1) revisited++;
    const s = statusOf(r, now);
    if (s === 'due' || s === 'overdue') due++;
  }
  return { total: lessons.length, read, revisited, due, passes };
}

/** How many passes a concept stands at, derived from the lessons that teach it. */
export function conceptStanding(
  conceptId: string,
  byConcept: Map<string, string[]>,
  records: Record<string, PassRecord>,
): { passes: number; lessons: string[] } {
  const lessons = byConcept.get(conceptId) ?? [];
  return { passes: conceptPasses(lessons, records), lessons };
}

export interface DueItem {
  id: string;
  title: string;
  level: number;
  minutes: number;
  record: PassRecord;
  urgency: number;
}

/** Everything read at least once and now due, most overdue first. */
export function dueForRevision(
  index: LessonIndexEntry[],
  records: Record<string, PassRecord>,
  now = Date.now(),
): DueItem[] {
  const out: DueItem[] = [];
  for (const lesson of index) {
    const record = records[lesson.id];
    if (!record) continue;
    const s = statusOf(record, now);
    if (s !== 'due' && s !== 'overdue') continue;
    out.push({
      id: lesson.id,
      title: lesson.title,
      level: lesson.level,
      minutes: lesson.minutes,
      record,
      urgency: urgency(record, now),
    });
  }
  return out.sort((a, b) => b.urgency - a.urgency);
}

/** The next unread lessons in curriculum order. */
export function unread(
  index: LessonIndexEntry[],
  records: Record<string, PassRecord>,
  limit = 5,
): LessonIndexEntry[] {
  return index.filter((l) => !records[l.id]).slice(0, limit);
}
