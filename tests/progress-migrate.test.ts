/**
 * Tests for reading stored progress.
 *
 * This is the only code in the application that can destroy something the learner cannot
 * recreate. A lesson renders the same tomorrow; a year of marked reading does not come back.
 *
 * Two failure modes are tested for specifically. Losing v1 progress on upgrade, which would be
 * silent - the learner just finds an empty site. And throwing on a malformed value, which would
 * take every page down rather than degrading, because the provider runs on every route.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY,
  migrate,
  parseImported,
  parseStored,
  type LegacyState,
} from '../src/lib/progress-migrate';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

const v1 = (over: Partial<LegacyState> = {}): LegacyState => ({
  version: 1,
  lessonsRead: { 'the-life-of-a-request': NOW - 10 * DAY },
  caseStudiesCompleted: { 'url-shortener': NOW - 3 * DAY },
  interviews: [],
  ...over,
});

describe('migrate from the inferred-mastery model', () => {
  test('a read timestamp becomes exactly one pass', () => {
    const out = migrate(v1());
    assert.deepEqual(out.lessons['the-life-of-a-request'], {
      reads: 1,
      lastRead: NOW - 10 * DAY,
      firstRead: NOW - 10 * DAY,
    });
  });

  test('completed case studies survive as passes too', () => {
    assert.equal(migrate(v1()).caseStudies['url-shortener']?.reads, 1);
  });

  test('interviews and the goal are carried across unchanged', () => {
    const interviews = [{ scenarioId: 'payments', at: NOW, scores: { depth: 3 }, turns: 9 }];
    const out = migrate(v1({ interviews, goal: 'staff interview' }));
    assert.deepEqual(out.interviews, interviews);
    assert.equal(out.goal, 'staff interview');
  });

  test('nothing claims a pass that was never asserted', () => {
    // The old model inferred concept mastery from check answers. There is no honest reading of
    // that as a number of reads, so it is dropped rather than invented into one.
    const withConcepts = { ...v1(), concepts: { sharding: { mastery: 4, lastReinforced: NOW } } };
    const out = migrate(withConcepts as LegacyState);
    assert.equal(Object.keys(out.lessons).length, 1);
    assert.ok(!('concepts' in out));
  });

  test('missing sections migrate to empty rather than throwing', () => {
    const out = migrate({ version: 1 });
    assert.deepEqual(out.lessons, {});
    assert.deepEqual(out.caseStudies, {});
    assert.deepEqual(out.interviews, []);
  });

  test('junk timestamps are dropped, not turned into 1970', () => {
    const out = migrate({
      version: 1,
      lessonsRead: { good: NOW, zero: 0, negative: -5, nan: NaN, text: 'yesterday' as never },
    });
    assert.deepEqual(Object.keys(out.lessons), ['good']);
  });
});

describe('parseStored', () => {
  test('nothing stored yields empty state', () => {
    assert.deepEqual(parseStored(null, null).state, EMPTY);
    assert.equal(parseStored(null, null).migrated, false);
  });

  test('current-format progress is returned as-is', () => {
    const stored = JSON.stringify({
      version: 2,
      lessons: { a: { reads: 3, lastRead: NOW, firstRead: NOW - 50 * DAY, pace: 'later' } },
      caseStudies: {},
      interviews: [],
    });
    const { state, migrated } = parseStored(stored, null);
    assert.equal(state.lessons.a?.reads, 3);
    assert.equal(state.lessons.a?.pace, 'later');
    assert.equal(migrated, false, 'current format must not be reported as migrated');
  });

  test('legacy progress is migrated and flagged so it can be written back once', () => {
    const { state, migrated } = parseStored(null, JSON.stringify(v1()));
    assert.equal(state.version, 2);
    assert.equal(state.lessons['the-life-of-a-request']?.reads, 1);
    assert.equal(migrated, true);
  });

  test('current format wins when both exist, so an upgrade is never undone', () => {
    // The v1 key is not deleted on upgrade. If the legacy branch ever took precedence, every
    // pass recorded after the upgrade would vanish on the next load.
    const current = JSON.stringify({
      version: 2,
      lessons: { a: { reads: 5, lastRead: NOW, firstRead: NOW } },
      caseStudies: {},
      interviews: [],
    });
    const { state, migrated } = parseStored(current, JSON.stringify(v1()));
    assert.equal(state.lessons.a?.reads, 5);
    assert.equal(state.lessons['the-life-of-a-request'], undefined);
    assert.equal(migrated, false);
  });

  test('malformed JSON degrades to empty instead of throwing', () => {
    // The provider mounts on every route, so an exception here is a blank site.
    for (const bad of ['{', 'null', '[]', '"a string"', 'undefined', '']) {
      assert.doesNotThrow(() => parseStored(bad, null));
      assert.deepEqual(parseStored(bad, null).state, EMPTY);
    }
  });

  test('an unknown version is not guessed at', () => {
    assert.deepEqual(parseStored(JSON.stringify({ version: 99 }), null).state, EMPTY);
  });

  test('individual corrupt records are dropped, keeping the good ones', () => {
    const stored = JSON.stringify({
      version: 2,
      lessons: {
        ok: { reads: 2, lastRead: NOW, firstRead: NOW },
        noReads: { lastRead: NOW },
        zeroReads: { reads: 0, lastRead: NOW },
        badTime: { reads: 1, lastRead: 'today' },
        notAnObject: 7,
      },
      caseStudies: {},
      interviews: [],
    });
    const { state } = parseStored(stored, null);
    assert.deepEqual(Object.keys(state.lessons), ['ok']);
  });

  test('a record missing firstRead is repaired rather than discarded', () => {
    const stored = JSON.stringify({
      version: 2,
      lessons: { a: { reads: 2, lastRead: NOW } },
      caseStudies: {},
      interviews: [],
    });
    const { state } = parseStored(stored, null);
    assert.equal(state.lessons.a?.firstRead, NOW);
  });

  test('an invalid pace is ignored rather than kept', () => {
    const stored = JSON.stringify({
      version: 2,
      lessons: { a: { reads: 1, lastRead: NOW, firstRead: NOW, pace: 'immediately' } },
      caseStudies: {},
      interviews: [],
    });
    assert.equal(parseStored(stored, null).state.lessons.a?.pace, undefined);
  });
});

describe('parseImported', () => {
  test('accepts an export of the current format', () => {
    const json = JSON.stringify({
      version: 2,
      lessons: { a: { reads: 2, lastRead: NOW, firstRead: NOW } },
      caseStudies: {},
      interviews: [],
    });
    assert.equal(parseImported(json)?.lessons.a?.reads, 2);
  });

  test('accepts and upgrades an export taken before the model changed', () => {
    const out = parseImported(JSON.stringify(v1()));
    assert.equal(out?.version, 2);
    assert.equal(out?.lessons['the-life-of-a-request']?.reads, 1);
  });

  test('refuses anything else, so a bad paste cannot wipe real progress', () => {
    for (const bad of ['{', '[]', 'null', '{"version":3}', '{"lessons":{}}']) {
      assert.equal(parseImported(bad), null, bad);
    }
  });
});
