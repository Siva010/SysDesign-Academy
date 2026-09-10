/**
 * Where a reader was in a long page, so they can be offered their place back.
 *
 * Pure, so it can be tested: the component does the storage and the scrolling. Positions are
 * kept per page under one key, capped in number, and ignored once stale - a section you were
 * half-way through six months ago is not a place anyone wants to be returned to.
 */

export const POSITION_KEY = 'sda.position.v1';

/** Enough for every page in the curriculum several times over, and a bound on storage. */
export const MAX_POSITIONS = 200;

export const OFFER_WINDOW_DAYS = 180;

/** Below this the reader had barely started; at or above the maximum they had finished. */
export const MIN_FRACTION = 0.04;
export const MAX_FRACTION = 0.95;

const DAY = 86_400_000;

export interface ReadingPosition {
  headingId: string;
  headingText: string;
  /** How far through the page body, from 0 to 1. */
  fraction: number;
  at: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function isPosition(v: unknown): v is ReadingPosition {
  if (!isRecord(v)) return false;
  const { headingId, headingText, fraction, at } = v;
  return (
    typeof headingId === 'string' &&
    headingId.length > 0 &&
    typeof headingText === 'string' &&
    typeof fraction === 'number' &&
    Number.isFinite(fraction) &&
    fraction >= 0 &&
    fraction <= 1 &&
    typeof at === 'number' &&
    Number.isFinite(at) &&
    at > 0
  );
}

/** Anything unreadable becomes an empty map, and individual bad entries are dropped. */
export function parsePositions(raw: string | null): Record<string, ReadingPosition> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!isRecord(parsed)) return {};
  const out: Record<string, ReadingPosition> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (isPosition(value)) out[key] = value;
  }
  return out;
}

/** Worth offering: part-way through, and recent enough that the place still means something. */
export function shouldOffer(position: ReadingPosition, now: number): boolean {
  if (position.fraction < MIN_FRACTION || position.fraction >= MAX_FRACTION) return false;
  const age = now - position.at;
  return age >= 0 && age <= OFFER_WINDOW_DAYS * DAY;
}

/** Insert or replace, dropping the oldest entries once over the limit. */
export function withPosition(
  map: Record<string, ReadingPosition>,
  key: string,
  position: ReadingPosition,
  limit = MAX_POSITIONS,
): Record<string, ReadingPosition> {
  const next = { ...map, [key]: position };
  const keys = Object.keys(next);
  if (keys.length <= limit) return next;
  const oldestFirst = keys.sort((a, b) => next[a]!.at - next[b]!.at);
  for (const stale of oldestFirst.slice(0, keys.length - limit)) delete next[stale];
  return next;
}

export function withoutPosition(
  map: Record<string, ReadingPosition>,
  key: string,
): Record<string, ReadingPosition> {
  if (!(key in map)) return map;
  const next = { ...map };
  delete next[key];
  return next;
}
