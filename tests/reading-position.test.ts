/**
 * Tests for the saved reading position.
 *
 * The failure worth guarding against is an offer that is wrong rather than absent: returning a
 * reader to a place they finished, a place from months ago, or a heading that no longer parses.
 * Each of those is worse than no offer at all, because it moves the reader somewhere they did
 * not ask to go.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_FRACTION,
  MIN_FRACTION,
  OFFER_WINDOW_DAYS,
  parsePositions,
  shouldOffer,
  withPosition,
  withoutPosition,
  type ReadingPosition,
} from '../src/lib/reading-position';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 10, 12, 0, 0);

const pos = (fraction: number, daysAgo = 1, headingId = 'trade-offs'): ReadingPosition => ({
  headingId,
  headingText: 'Trade-offs',
  fraction,
  at: NOW - daysAgo * DAY,
});

describe('parsePositions', () => {
  test('nothing or garbage stored is an empty map, never an exception', () => {
    for (const raw of [null, '', '{', 'null', '[]', '"text"', '42']) {
      assert.doesNotThrow(() => parsePositions(raw));
      assert.deepEqual(parsePositions(raw), {});
    }
  });

  test('keeps valid entries and drops the malformed ones', () => {
    const raw = JSON.stringify({
      good: pos(0.4),
      tooFar: { ...pos(0.4), fraction: 1.5 },
      noHeading: { ...pos(0.4), headingId: '' },
      badTime: { ...pos(0.4), at: 'yesterday' },
      notObject: 3,
    });
    assert.deepEqual(Object.keys(parsePositions(raw)), ['good']);
  });
});

describe('shouldOffer', () => {
  test('offers a place part-way through a recent read', () => {
    assert.equal(shouldOffer(pos(0.5), NOW), true);
  });

  test('does not offer when the reader had barely started', () => {
    assert.equal(shouldOffer(pos(MIN_FRACTION / 2), NOW), false);
  });

  test('does not offer a page the reader had finished', () => {
    // Being offered "continue" on something you finished reads as the site forgetting you.
    assert.equal(shouldOffer(pos(MAX_FRACTION), NOW), false);
    assert.equal(shouldOffer(pos(0.99), NOW), false);
  });

  test('does not offer a place that has gone stale', () => {
    assert.equal(shouldOffer(pos(0.5, OFFER_WINDOW_DAYS - 1), NOW), true);
    assert.equal(shouldOffer(pos(0.5, OFFER_WINDOW_DAYS + 1), NOW), false);
  });

  test('does not trust a timestamp from the future', () => {
    assert.equal(shouldOffer(pos(0.5, -2), NOW), false);
  });
});

describe('withPosition and withoutPosition', () => {
  test('inserts and replaces by key', () => {
    const once = withPosition({}, 'lesson:a', pos(0.2));
    const twice = withPosition(once, 'lesson:a', pos(0.6));
    assert.equal(Object.keys(twice).length, 1);
    assert.equal(twice['lesson:a']?.fraction, 0.6);
  });

  test('drops the oldest entries once over the limit, keeping the newest', () => {
    let map: Record<string, ReadingPosition> = {};
    for (let i = 0; i < 5; i++) map = withPosition(map, `k${i}`, pos(0.5, 10 - i), 3);
    assert.deepEqual(Object.keys(map).sort(), ['k2', 'k3', 'k4']);
  });

  test('the entry just written survives pruning', () => {
    let map: Record<string, ReadingPosition> = {};
    for (let i = 0; i < 3; i++) map = withPosition(map, `old${i}`, pos(0.5, 50 + i), 3);
    map = withPosition(map, 'fresh', pos(0.5, 0), 3);
    assert.ok('fresh' in map);
  });

  test('removal returns the same map when there was nothing to remove', () => {
    const map = withPosition({}, 'a', pos(0.3));
    assert.equal(withoutPosition(map, 'missing'), map);
    assert.deepEqual(withoutPosition(map, 'a'), {});
  });
});
