/**
 * Tests for the pass schedule.
 *
 * These exist because the scheduling rules are invisible when they are wrong. An off-by-one in
 * the interval ladder, or an overdue window that is a day instead of an interval, produces no
 * error and no symptom - the application just quietly tells the learner the wrong thing about
 * their own reading, which is exactly the failure the previous model was deleted for.
 *
 * Every test pins a *decision* rather than an implementation detail, so the numbers can be tuned
 * by changing INTERVAL_DAYS and the tests that should fail are the ones that assert those values.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERVAL_DAYS,
  PASSES,
  conceptPasses,
  dueAt,
  intervalFor,
  nextPass,
  passLabel,
  recordPass,
  relativeDays,
  statusOf,
  undoPass,
  type PassRecord,
} from '../src/lib/passes';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

/** A record read `reads` times, `daysAgo` days ago. */
const rec = (reads: number, daysAgo: number, pace?: 'sooner' | 'later'): PassRecord => ({
  reads,
  lastRead: NOW - daysAgo * DAY,
  firstRead: NOW - (daysAgo + 100) * DAY,
  ...(pace ? { pace } : {}),
});

describe('nextPass', () => {
  test('an unread item is about to get its first read', () => {
    assert.equal(nextPass(undefined).index, 0);
    assert.equal(nextPass(undefined).name, 'First read');
  });

  test('the pass after n reads is the (n+1)th', () => {
    assert.equal(nextPass(rec(1, 0)).name, 'Second pass');
    assert.equal(nextPass(rec(2, 0)).name, 'Third pass');
    assert.equal(nextPass(rec(3, 0)).name, 'Fourth pass');
  });

  test('clamps to maintenance rather than running off the end', () => {
    // The bug this catches is an undefined read, which renders as a blank instruction panel.
    for (const reads of [4, 5, 12, 500]) {
      const pass = nextPass(rec(reads, 0));
      assert.equal(pass.name, 'Maintenance');
      assert.equal(pass.index, PASSES.length - 1);
      assert.ok(pass.job.length > 0);
    }
  });

  test('every pass carries an instruction, since a bare count teaches nothing', () => {
    for (const p of PASSES) {
      assert.ok(p.name.length > 0);
      assert.ok(p.job.length > 20, `${p.name} needs a real instruction`);
    }
  });
});

describe('intervalFor', () => {
  test('follows the ladder, indexed by passes already done', () => {
    for (const [i, days] of INTERVAL_DAYS.entries()) {
      assert.equal(intervalFor(rec(i + 1, 0)), days * DAY, `after ${i + 1} reads`);
    }
  });

  test('holds at the final interval once the ladder runs out', () => {
    const steady = INTERVAL_DAYS[INTERVAL_DAYS.length - 1]! * DAY;
    assert.equal(intervalFor(rec(INTERVAL_DAYS.length + 1, 0)), steady);
    assert.equal(intervalFor(rec(99, 0)), steady);
  });

  test('the ladder expands, which is the whole point of spacing', () => {
    for (let i = 1; i < INTERVAL_DAYS.length; i++) {
      assert.ok(
        INTERVAL_DAYS[i]! > INTERVAL_DAYS[i - 1]!,
        'each interval must be longer than the one before it',
      );
    }
  });

  test('pace pulls the next pass in or pushes it out', () => {
    const base = intervalFor(rec(2, 0));
    assert.ok(intervalFor(rec(2, 0, 'sooner')) < base);
    assert.ok(intervalFor(rec(2, 0, 'later')) > base);
  });

  test('sooner never collapses to zero, which would make an item permanently due', () => {
    for (let reads = 1; reads <= 6; reads++) {
      assert.ok(intervalFor(rec(reads, 0, 'sooner')) >= DAY, `reads=${reads}`);
    }
  });
});

describe('statusOf', () => {
  test('no record is unread', () => {
    assert.equal(statusOf(undefined, NOW), 'unread');
  });

  test('resting until the interval has elapsed', () => {
    const first = INTERVAL_DAYS[0]!;
    assert.equal(statusOf(rec(1, 0), NOW), 'resting');
    assert.equal(statusOf(rec(1, first - 1), NOW), 'resting');
  });

  test('due once it passes, and only overdue after a further whole interval', () => {
    const first = INTERVAL_DAYS[0]!;
    assert.equal(statusOf(rec(1, first + 1), NOW), 'due');
    assert.equal(statusOf(rec(1, first * 2 - 1), NOW), 'due');
    assert.equal(statusOf(rec(1, first * 2 + 1), NOW), 'overdue');
  });

  test('the overdue window is generous on purpose', () => {
    // A list that turns red the day after something is due teaches people to ignore it. Read
    // ninety days ago on a ninety-day interval is due, not overdue.
    const record = rec(4, 91);
    assert.equal(intervalFor(record), 90 * DAY);
    assert.equal(statusOf(record, NOW), 'due');
  });
});

describe('recordPass and undoPass', () => {
  test('a first pass starts the count and sets both timestamps', () => {
    const r = recordPass(undefined, NOW);
    assert.deepEqual(r, { reads: 1, lastRead: NOW, firstRead: NOW });
  });

  test('a later pass increments and preserves the original first read', () => {
    const first = recordPass(undefined, NOW - 40 * DAY);
    const second = recordPass(first, NOW);
    assert.equal(second.reads, 2);
    assert.equal(second.lastRead, NOW);
    assert.equal(second.firstRead, first.firstRead, 'firstRead is history and must not move');
  });

  test('undo steps back a pass', () => {
    const twice = recordPass(recordPass(undefined, NOW - DAY), NOW);
    const undone = undoPass(twice);
    assert.equal(undone?.reads, 1);
  });

  test('undoing the only pass removes the record, so the item is unread again', () => {
    assert.equal(undoPass(recordPass(undefined, NOW)), undefined);
    assert.equal(undoPass(undefined), undefined);
  });

  test('round trip leaves the count where it started', () => {
    const before = rec(3, 5);
    const after = undoPass(recordPass(before, NOW));
    assert.equal(after?.reads, before.reads);
  });
});

describe('conceptPasses', () => {
  const records = { a: rec(1, 0), b: rec(4, 0), c: rec(2, 0) };

  test('is the best pass count among the lessons that teach it', () => {
    // Not a sum: meeting an idea in four lessons once each is not knowing it four times.
    assert.equal(conceptPasses(['a', 'b', 'c'], records), 4);
    assert.equal(conceptPasses(['a', 'c'], records), 2);
  });

  test('unknown or unread lessons contribute nothing', () => {
    assert.equal(conceptPasses(['nope'], records), 0);
    assert.equal(conceptPasses([], records), 0);
    assert.equal(conceptPasses(['a', 'nope'], records), 1);
  });
});

describe('labels', () => {
  test('counts read as English', () => {
    assert.equal(passLabel(0), 'Unread');
    assert.equal(passLabel(1), 'Read once');
    assert.equal(passLabel(2), 'Read twice');
    assert.equal(passLabel(3), 'Read 3 times');
  });

  test('relative days name the near ones and count the rest', () => {
    assert.equal(relativeDays(NOW, NOW), 'today');
    assert.equal(relativeDays(NOW + DAY, NOW), 'tomorrow');
    assert.equal(relativeDays(NOW - DAY, NOW), 'yesterday');
    assert.equal(relativeDays(NOW + 5 * DAY, NOW), 'in 5 days');
    assert.equal(relativeDays(NOW - 5 * DAY, NOW), '5 days ago');
  });

  test('a due date is never described as though it were in the future', () => {
    const overdue = rec(1, 30);
    assert.ok(relativeDays(dueAt(overdue), NOW).endsWith('ago'));
  });
});
