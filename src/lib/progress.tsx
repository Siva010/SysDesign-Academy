'use client';

/**
 * Learner progress and the mastery model (docs/07-assessment-taxonomy.md).
 *
 * Stored in localStorage: this is a single-learner client-side app, and progress is not
 * worth an account. Everything degrades gracefully if storage is unavailable (private
 * windows, blocked site data), which is why every access is wrapped.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ConceptProgress, InterviewResult, MasteryLevel, ProgressState } from './types';

const KEY = 'sda.progress.v1';
const DAY = 86_400_000;

/** Mastery 2 (understood) decays after this long without reinforcement. */
export const DECAY_DAYS = 60;

const EMPTY: ProgressState = {
  version: 1,
  lessonsRead: {},
  concepts: {},
  caseStudiesCompleted: {},
  interviews: [],
};

function read(): ProgressState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (parsed.version !== 1) return EMPTY;
    return {
      ...EMPTY,
      ...parsed,
      lessonsRead: parsed.lessonsRead ?? {},
      concepts: parsed.concepts ?? {},
      caseStudiesCompleted: parsed.caseStudiesCompleted ?? {},
      interviews: parsed.interviews ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function write(state: ProgressState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked or full: progress is a convenience, not a requirement */
  }
}

/**
 * Effective mastery, after decay.
 * Level 3+ (applied, transferred) does not decay: doing something is stickier than reading it.
 */
export function effectiveMastery(p: ConceptProgress | undefined): MasteryLevel {
  if (!p) return 0;
  if (p.mastery >= 3) return p.mastery;
  const age = Date.now() - p.lastReinforced;
  if (p.mastery === 2 && age > DECAY_DAYS * DAY) return 1;
  return p.mastery;
}

interface ProgressApi {
  state: ProgressState;
  ready: boolean;
  mastery: (conceptId: string) => MasteryLevel;
  markLessonRead: (lessonId: string, concepts: string[]) => void;
  recordAnswer: (concepts: string[], credit: 'full' | 'partial' | 'none', context: 'lesson' | 'exercise' | 'case-study' | 'interview') => void;
  completeCaseStudy: (id: string, concepts: string[]) => void;
  recordInterview: (result: InterviewResult) => void;
  setGoal: (goal: string | undefined) => void;
  reset: () => void;
  exportState: () => string;
  importState: (json: string) => boolean;
}

const Ctx = createContext<ProgressApi | null>(null);

/** Mastery a piece of evidence can justify on its own. */
const CEILING: Record<'lesson' | 'exercise' | 'case-study' | 'interview', MasteryLevel> = {
  lesson: 1,
  exercise: 2,
  'case-study': 3,
  interview: 4,
};

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

  const bump = useCallback(
    (s: ProgressState, conceptId: string, target: MasteryLevel, correct: boolean): ProgressState => {
      const cur: ConceptProgress = s.concepts[conceptId] ?? {
        mastery: 0,
        lastReinforced: 0,
        attempts: 0,
        correct: 0,
      };
      const nextMastery = (correct ? Math.max(cur.mastery, target) : cur.mastery) as MasteryLevel;
      return {
        ...s,
        concepts: {
          ...s.concepts,
          [conceptId]: {
            mastery: nextMastery,
            lastReinforced: Date.now(),
            attempts: cur.attempts + 1,
            correct: cur.correct + (correct ? 1 : 0),
          },
        },
      };
    },
    [],
  );

  const api = useMemo<ProgressApi>(
    () => ({
      state,
      ready,
      mastery: (id) => effectiveMastery(state.concepts[id]),

      markLessonRead: (lessonId, concepts) =>
        update((s) => {
          let next: ProgressState = {
            ...s,
            lessonsRead: { ...s.lessonsRead, [lessonId]: Date.now() },
          };
          for (const c of concepts) next = bump(next, c, CEILING.lesson, true);
          return next;
        }),

      recordAnswer: (concepts, credit, context) =>
        update((s) => {
          let next = s;
          const correct = credit !== 'none';
          const target = credit === 'full' ? CEILING[context] : (Math.max(1, CEILING[context] - 1) as MasteryLevel);
          for (const c of concepts) next = bump(next, c, target, correct);
          return next;
        }),

      completeCaseStudy: (id, concepts) =>
        update((s) => {
          let next: ProgressState = {
            ...s,
            caseStudiesCompleted: { ...s.caseStudiesCompleted, [id]: Date.now() },
          };
          for (const c of concepts) next = bump(next, c, CEILING['case-study'], true);
          return next;
        }),

      recordInterview: (result) =>
        update((s) => ({ ...s, interviews: [...s.interviews, result].slice(-50) })),

      setGoal: (goal) => update((s) => ({ ...s, goal })),

      reset: () =>
        update(() => {
          return { ...EMPTY };
        }),

      exportState: () => JSON.stringify(state, null, 2),

      importState: (json) => {
        try {
          const parsed = JSON.parse(json) as ProgressState;
          if (parsed.version !== 1) return false;
          update(() => parsed);
          return true;
        } catch {
          return false;
        }
      },
    }),
    [state, ready, update, bump],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}

/**
 * Mastery summary for a set of concepts. Used by level cards and the dashboard.
 * "Solid" counts only levels 3-4, which is the gate described in the assessment taxonomy.
 */
export function summarise(
  state: ProgressState,
  conceptIds: string[],
): { seen: number; understood: number; solid: number; total: number; percent: number } {
  let seen = 0;
  let understood = 0;
  let solid = 0;
  for (const id of conceptIds) {
    const m = effectiveMastery(state.concepts[id]);
    if (m >= 1) seen++;
    if (m >= 2) understood++;
    if (m >= 3) solid++;
  }
  const total = conceptIds.length || 1;
  return {
    seen,
    understood,
    solid,
    total: conceptIds.length,
    percent: Math.round(((understood + solid) / (2 * total)) * 100),
  };
}
