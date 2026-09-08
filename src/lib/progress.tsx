'use client';

/**
 * Learner progress, stored as reading passes.
 *
 * The model is deliberately small: the application records what you tell it you did, and
 * derives everything else. There is no inferred skill level, because a number the software
 * assigns you from rules you cannot see is not information about you - it is the software's
 * opinion, and it was wrong often enough to be worth deleting.
 *
 * Scheduling lives in ./passes, which is pure. This file is storage and React.
 *
 * Kept in localStorage: single learner, client-side, not worth an account. Every access is
 * wrapped because storage genuinely fails - private windows, blocked site data, quota - and
 * progress is a convenience rather than a requirement.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { InterviewResult, ProgressState } from './types';
import { type Pace, type PassRecord, recordPass, undoPass } from './passes';

const KEY = 'sda.progress.v2';
const LEGACY_KEY = 'sda.progress.v1';

const EMPTY: ProgressState = {
  version: 2,
  lessons: {},
  caseStudies: {},
  interviews: [],
};

/** Shape of the model this replaced, kept only so existing progress survives the change. */
interface LegacyState {
  version: 1;
  lessonsRead?: Record<string, number>;
  caseStudiesCompleted?: Record<string, number>;
  interviews?: InterviewResult[];
  goal?: string;
}

/**
 * A timestamp under the old model meant "read once, then". That maps exactly onto one pass,
 * which is the whole migration. The old per-concept mastery is discarded rather than converted:
 * it was derived from check answers, there is no honest reading of it as a number of passes,
 * and inventing one would reintroduce the guessing this change exists to remove.
 */
function migrate(legacy: LegacyState): ProgressState {
  const asPasses = (src: Record<string, number> = {}): Record<string, PassRecord> => {
    const out: Record<string, PassRecord> = {};
    for (const [id, at] of Object.entries(src)) {
      if (typeof at === 'number' && at > 0) out[id] = { reads: 1, lastRead: at, firstRead: at };
    }
    return out;
  };
  return {
    version: 2,
    lessons: asPasses(legacy.lessonsRead),
    caseStudies: asPasses(legacy.caseStudiesCompleted),
    interviews: legacy.interviews ?? [],
    ...(legacy.goal ? { goal: legacy.goal } : {}),
  };
}

function read(): ProgressState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      if (parsed.version !== 2) return EMPTY;
      return {
        ...EMPTY,
        ...parsed,
        lessons: parsed.lessons ?? {},
        caseStudies: parsed.caseStudies ?? {},
        interviews: parsed.interviews ?? [],
      };
    }
    const old = window.localStorage.getItem(LEGACY_KEY);
    if (old) {
      const parsed = JSON.parse(old) as LegacyState;
      if (parsed.version === 1) {
        const migrated = migrate(parsed);
        write(migrated);
        return migrated;
      }
    }
  } catch {
    /* unreadable or blocked: start empty rather than failing to render */
  }
  return EMPTY;
}

function write(state: ProgressState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked or full: progress is a convenience, not a requirement */
  }
}

export type PassKind = 'lesson' | 'case-study';

interface ProgressApi {
  state: ProgressState;
  ready: boolean;
  /** The record for one item, or undefined when it has never been read. */
  recordFor: (kind: PassKind, id: string) => PassRecord | undefined;
  /** Every record of a kind, for the derived views. */
  recordsOf: (kind: PassKind) => Record<string, PassRecord>;
  markRead: (kind: PassKind, id: string, pace?: Pace) => void;
  undoRead: (kind: PassKind, id: string) => void;
  setPace: (kind: PassKind, id: string, pace: Pace | undefined) => void;
  recordInterview: (result: InterviewResult) => void;
  setGoal: (goal: string | undefined) => void;
  reset: () => void;
  exportState: () => string;
  importState: (json: string) => boolean;
}

const Ctx = createContext<ProgressApi | null>(null);

type Bucket = 'lessons' | 'caseStudies';
const bucket = (kind: PassKind): Bucket => (kind === 'lesson' ? 'lessons' : 'caseStudies');

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  const update = useCallback((fn: (s: ProgressState) => ProgressState) => {
    setState((prev) => {
      const next = fn(prev);
      write(next);
      return next;
    });
  }, []);

  const api = useMemo<ProgressApi>(
    () => ({
      state,
      ready,

      recordFor: (kind, id) => state[bucket(kind)][id],
      recordsOf: (kind) => state[bucket(kind)],

      markRead: (kind, id, pace) =>
        update((s) => {
          const key = bucket(kind);
          return {
            ...s,
            [key]: { ...s[key], [id]: recordPass(s[key][id], Date.now(), pace) },
          };
        }),

      undoRead: (kind, id) =>
        update((s) => {
          const key = bucket(kind);
          const next = { ...s[key] };
          const undone = undoPass(next[id]);
          if (undone) next[id] = undone;
          else delete next[id];
          return { ...s, [key]: next };
        }),

      setPace: (kind, id, pace) =>
        update((s) => {
          const key = bucket(kind);
          const cur = s[key][id];
          if (!cur) return s;
          const next = { ...cur };
          if (pace) next.pace = pace;
          else delete next.pace;
          return { ...s, [key]: { ...s[key], [id]: next } };
        }),

      recordInterview: (result) =>
        update((s) => ({ ...s, interviews: [...s.interviews, result].slice(-50) })),

      setGoal: (goal) => update((s) => ({ ...s, goal })),

      reset: () => update(() => ({ ...EMPTY })),

      exportState: () => JSON.stringify(state, null, 2),

      importState: (json) => {
        try {
          const parsed = JSON.parse(json) as ProgressState | LegacyState;
          if (parsed.version === 1) {
            update(() => migrate(parsed as LegacyState));
            return true;
          }
          if (parsed.version === 2) {
            update(() => ({ ...EMPTY, ...(parsed as ProgressState) }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    [state, ready, update],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
