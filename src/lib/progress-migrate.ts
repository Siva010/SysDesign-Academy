/**
 * Reading stored progress, including progress written by the model this replaced.
 *
 * Separated from the React provider because this is the one piece of the application that can
 * destroy something the learner cannot recreate. A lesson renders the same tomorrow; a year of
 * marked reading does not come back. So it lives in a pure module with tests, and the provider
 * only calls it.
 *
 * The rule throughout: an unreadable or unrecognised payload yields empty state rather than an
 * exception. Progress is a convenience, and a corrupt value in localStorage must not be able to
 * stop a page from rendering.
 */
import type { InterviewResult, ProgressState } from './types';
import type { PassRecord } from './passes';

export const STORAGE_KEY = 'sda.progress.v2';
export const LEGACY_STORAGE_KEY = 'sda.progress.v1';

export const EMPTY: ProgressState = {
  version: 2,
  lessons: {},
  caseStudies: {},
  interviews: [],
};

/** The shape written by the inferred-mastery model, kept only so that progress survives. */
export interface LegacyState {
  version: 1;
  lessonsRead?: Record<string, number>;
  caseStudiesCompleted?: Record<string, number>;
  interviews?: InterviewResult[];
  goal?: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Drops anything that is not a usable record rather than trusting the stored shape. */
function passRecords(src: unknown): Record<string, PassRecord> {
  const out: Record<string, PassRecord> = {};
  if (!isRecord(src)) return out;
  for (const [id, value] of Object.entries(src)) {
    if (!isRecord(value)) continue;
    const { reads, lastRead, firstRead, pace } = value as Partial<PassRecord>;
    if (typeof reads !== 'number' || !Number.isFinite(reads) || reads < 1) continue;
    if (typeof lastRead !== 'number' || !Number.isFinite(lastRead)) continue;
    out[id] = {
      reads: Math.floor(reads),
      lastRead,
      firstRead: typeof firstRead === 'number' && Number.isFinite(firstRead) ? firstRead : lastRead,
      ...(pace === 'sooner' || pace === 'later' ? { pace } : {}),
    };
  }
  return out;
}

/**
 * A timestamp under the old model meant "read once, then". That maps exactly onto one pass,
 * which is the whole migration.
 *
 * The old per-concept mastery is discarded rather than converted. It was inferred from check
 * answers, so there is no honest reading of it as a number of passes, and inventing one would
 * reintroduce exactly the guessing this change removed. Reads and case studies are the parts
 * the learner actually asserted, and they are the parts that survive.
 */
export function migrate(legacy: LegacyState): ProgressState {
  const fromTimestamps = (src: Record<string, number> | undefined): Record<string, PassRecord> => {
    const out: Record<string, PassRecord> = {};
    if (!isRecord(src)) return out;
    for (const [id, at] of Object.entries(src)) {
      if (typeof at === 'number' && Number.isFinite(at) && at > 0) {
        out[id] = { reads: 1, lastRead: at, firstRead: at };
      }
    }
    return out;
  };

  return {
    version: 2,
    lessons: fromTimestamps(legacy.lessonsRead),
    caseStudies: fromTimestamps(legacy.caseStudiesCompleted),
    interviews: Array.isArray(legacy.interviews) ? legacy.interviews : [],
    ...(typeof legacy.goal === 'string' ? { goal: legacy.goal } : {}),
  };
}

/**
 * Turn whatever was stored into usable state.
 *
 * `migrated` tells the caller to write the result back, so a v1 payload is upgraded once rather
 * than re-converted on every page load.
 */
export function parseStored(
  current: string | null,
  legacy: string | null,
): { state: ProgressState; migrated: boolean } {
  const parse = (raw: string | null): unknown => {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  };

  const now = parse(current);
  if (isRecord(now) && now.version === 2) {
    return {
      state: {
        version: 2,
        lessons: passRecords(now.lessons),
        caseStudies: passRecords(now.caseStudies),
        interviews: Array.isArray(now.interviews) ? (now.interviews as InterviewResult[]) : [],
        ...(typeof now.goal === 'string' ? { goal: now.goal } : {}),
      },
      migrated: false,
    };
  }

  const old = parse(legacy);
  if (isRecord(old) && old.version === 1) {
    return { state: migrate(old as unknown as LegacyState), migrated: true };
  }

  return { state: { ...EMPTY }, migrated: false };
}

/** Accepts either format, for the import box on the progress page. */
export function parseImported(json: string): ProgressState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.version === 1) return migrate(parsed as unknown as LegacyState);
  if (parsed.version === 2) {
    return parseStored(JSON.stringify(parsed), null).state;
  }
  return null;
}
