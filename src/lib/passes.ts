/**
 * Reading passes and the rotation between them.
 *
 * This replaces an inferred mastery model. That model tried to deduce what you knew from how
 * you answered checks, which meant the number on screen was an opinion the software held about
 * you, arrived at by rules you could not see and did not agree to. It also could not represent
 * the thing people actually do with dense material, which is read it again.
 *
 * So the unit here is a **pass**: you read something, you say so, and it comes back later. The
 * count is the honest thing to record because it is the only thing the application actually
 * observes. Everything else - whether a concept is "solid", what to revisit - is derived from
 * passes rather than stored, so there is one fact and no bookkeeping to drift.
 *
 * Pure module, no React and no storage, so the schedule can be reasoned about on its own.
 */

const DAY = 86_400_000;

/**
 * Days until a thing is due again, indexed by how many passes are behind it.
 *
 * Expanding, because the point of spacing is that each successful recall buys a longer gap.
 * The specific numbers are a conventional expanding ladder rather than a finding: what matters
 * is the shape, and that the last interval is long enough to be maintenance rather than study.
 */
export const INTERVAL_DAYS = [3, 10, 30, 90, 180] as const;

/** After the ladder runs out, everything repeats at the final interval. */
export const STEADY_STATE_DAYS: number = INTERVAL_DAYS[INTERVAL_DAYS.length - 1] ?? 180;

/** A learner can pull the next pass in or push it out. Nothing else adjusts the schedule. */
export type Pace = 'sooner' | 'later';

const PACE_FACTOR: Record<Pace, number> = { sooner: 0.4, later: 2 };

export interface PassRecord {
  /** Completed passes. Never zero - an absent record means unread. */
  reads: number;
  lastRead: number;
  firstRead: number;
  pace?: Pace;
}

export type PassStatus = 'unread' | 'resting' | 'due' | 'overdue';

/**
 * What a given pass is *for*.
 *
 * This is the part that makes a count worth keeping. Reading something a second time is not
 * the same activity as reading it the first time, and the usual reason a re-read feels useless
 * is that it was performed identically to the one before it. Naming the job for each pass turns
 * a counter into an instruction.
 *
 * Indexed by the pass you are about to do, so PASSES[0] describes a first read.
 */
export const PASSES: { name: string; job: string }[] = [
  {
    name: 'First read',
    job: 'Read it straight through. Do not stop at the parts you do not follow yet - the argument usually closes them later, and stopping is how people abandon a lesson three sections in.',
  },
  {
    name: 'Second pass',
    job: 'Go to the trade-offs and the failure modes. Almost everyone skims those first time round, because the mechanism is more interesting than its price. This time the mechanism is familiar and the price is the new information.',
  },
  {
    name: 'Third pass',
    job: 'Read the headings, then look away and reconstruct the argument before you read the body. What you cannot reconstruct is what you have actually not learnt, and it is usually a surprise.',
  },
  {
    name: 'Fourth pass',
    job: 'Read for what has changed in your head. You have hit some of this in real work by now, and the sentences that felt abstract the first time are the ones to slow down on.',
  },
  {
    name: 'Maintenance',
    job: 'Skim it. Check the diagram, read the trade-off table, and move on. If nothing surprises you, that is the result you wanted.',
  },
];

/** The pass a learner is about to perform, given what they have done. */
export function nextPass(record: PassRecord | undefined): { index: number; name: string; job: string } {
  const done = record?.reads ?? 0;
  const index = Math.min(done, PASSES.length - 1);
  return { index, ...PASSES[index]! };
}

/** Milliseconds a record rests before it is due again. */
export function intervalFor(record: PassRecord): number {
  const base = INTERVAL_DAYS[record.reads - 1] ?? STEADY_STATE_DAYS;
  const factor = record.pace ? PACE_FACTOR[record.pace] : 1;
  return Math.round(base * factor * DAY);
}

/** When this comes back round. */
export function dueAt(record: PassRecord): number {
  return record.lastRead + intervalFor(record);
}

/**
 * Overdue is deliberately generous: a full interval past due, rather than a day. Something read
 * three months ago and due at ninety days is not meaningfully more urgent on day ninety-one, and
 * a list that turns red the moment you look away teaches people to ignore it.
 */
export function statusOf(record: PassRecord | undefined, now = Date.now()): PassStatus {
  if (!record) return 'unread';
  const due = dueAt(record);
  if (now < due) return 'resting';
  return now > due + intervalFor(record) ? 'overdue' : 'due';
}

/** Sort key for a revision list: most overdue first, then by how long it has been resting. */
export function urgency(record: PassRecord, now = Date.now()): number {
  const interval = intervalFor(record);
  return (now - dueAt(record)) / interval;
}

/**
 * A concept's standing, derived from the lessons that teach it rather than stored.
 *
 * The best pass count among its lessons, because a concept taught by four lessons is not
 * four times learnt - you have met it as many times as the lesson you know best.
 */
export function conceptPasses(
  lessonIds: string[],
  records: Record<string, PassRecord | undefined>,
): number {
  let best = 0;
  for (const id of lessonIds) {
    const r = records[id];
    if (r && r.reads > best) best = r.reads;
  }
  return best;
}

/** Human phrasing for a count, used in a dozen places and worth having in one. */
export function passLabel(reads: number): string {
  if (reads === 0) return 'Unread';
  if (reads === 1) return 'Read once';
  if (reads === 2) return 'Read twice';
  return `Read ${reads} times`;
}

/** "in 3 days", "today", "6 days ago". Coarse on purpose: precision here is false confidence. */
export function relativeDays(ms: number, now = Date.now()): string {
  const days = Math.round((ms - now) / DAY);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0) return `in ${days} days`;
  return `${-days} days ago`;
}

/** Apply a completed pass to a record, returning the new one. */
export function recordPass(
  record: PassRecord | undefined,
  at: number,
  pace?: Pace,
): PassRecord {
  return {
    reads: (record?.reads ?? 0) + 1,
    lastRead: at,
    firstRead: record?.firstRead ?? at,
    ...(pace ? { pace } : {}),
  };
}

/** Undo the most recent pass. Returns undefined when that removes the record entirely. */
export function undoPass(record: PassRecord | undefined): PassRecord | undefined {
  if (!record || record.reads <= 1) return undefined;
  return { ...record, reads: record.reads - 1 };
}
