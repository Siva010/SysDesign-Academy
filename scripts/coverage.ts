/**
 * Curriculum coverage report. Run with `npm run coverage`.
 *
 * The validator answers "is anything broken?". This answers "where is the curriculum thin?",
 * which is a question with no pass or fail and therefore no place in a build gate.
 *
 * It exists because the same facts used to live in a hand-written table in docs/09-coverage.md,
 * where they were correct on the day they were typed and drifted silently afterwards. A number
 * that has to be re-derived by a person is a number that will eventually be wrong in a document
 * claiming to be a coverage report.
 */
import { CONCEPTS } from '../src/content/concepts';
import { SOURCES } from '../src/content/sources';
import { LEVELS } from '../src/content/curriculum';
import { PRIMITIVE_SIGNATURES } from '../src/lib/types';
import {
  loadAllCaseStudies,
  loadAllFailures,
  loadAllLessons,
  loadAllPatterns,
} from '../src/lib/content-node';

const lessons = loadAllLessons();
const caseStudies = loadAllCaseStudies();
const patterns = loadAllPatterns();
const failures = loadAllFailures();

const words = (xs: { body?: string }[]) =>
  xs.reduce((total, x) => total + (x.body ?? '').split(/\s+/).filter(Boolean).length, 0);

/** Explicit locale: the default follows the machine's, which groups digits differently by region. */
const n0 = (n: number) => n.toLocaleString('en-US');

const rule = (label: string) => console.log(`\n${label}\n${'-'.repeat(label.length)}`);

/* ------------------------------------------------------------------ volume */

rule('Volume');
const corpus: [string, { body?: string }[]][] = [
  ['lessons', lessons],
  ['case studies', caseStudies],
  ['patterns', patterns],
  ['failures', failures],
];
let totalWords = 0;
for (const [label, xs] of corpus) {
  const w = words(xs);
  totalWords += w;
  console.log(`  ${label.padEnd(14)} ${String(xs.length).padStart(3)} files  ${n0(w)} words`);
}
console.log(`  ${'total'.padEnd(14)} ${' '.repeat(9)} ${n0(totalWords)} words`);

/* -------------------------------------------------- signatures, the depth claim */

rule('Case studies per primitive signature');
const bySignature = new Map<string, string[]>(PRIMITIVE_SIGNATURES.map((s) => [s, []]));
for (const c of caseStudies) {
  for (const s of c.signatures) bySignature.get(s)?.push(c.id);
}
for (const [sig, ids] of bySignature) {
  const flag = ids.length === 0 ? ' MISSING' : ids.length === 1 ? ' thin' : '';
  console.log(`  ${sig.padEnd(22)} ${String(ids.length).padStart(2)}${flag.padEnd(8)} ${ids.join(', ')}`);
}
const thin = [...bySignature.values()].filter((v) => v.length === 1).length;
const missing = [...bySignature.values()].filter((v) => v.length === 0).length;
console.log(
  `\n  ${missing} uncovered, ${thin} with a single example.` +
    (thin + missing === 0 ? ' Every signature has at least two.' : ' Two is what supports transfer.'),
);

/* ------------------------------------------------------------------ the graph */

rule('Concepts');
const taught = new Set(lessons.flatMap((l) => l.concepts ?? []));
console.log(`  ${CONCEPTS.length} concepts, ${CONCEPTS.length - taught.size} taught by no lesson`);
const withMyth = CONCEPTS.filter((c) => c.myth).length;
const tensionEdges = CONCEPTS.reduce((n, c) => n + (c.tensionWith ?? []).length, 0);
console.log(`  ${withMyth} carry a myth, ${tensionEdges} declared tension edges`);

const perLevel = new Map<number, number>();
for (const l of lessons) perLevel.set(l.level, (perLevel.get(l.level) ?? 0) + 1);
rule('Lessons per level');
for (const level of LEVELS) {
  const n = perLevel.get(level.index) ?? 0;
  console.log(`  Level ${level.index}  ${String(n).padStart(2)} lessons  ${level.name}`);
}

/* ------------------------------------------------------------------ sources */

rule('Sources');
const cited = new Set(
  [...lessons, ...caseStudies, ...patterns, ...failures].flatMap((x) => x.sources ?? []),
);
const byTier = new Map<number, number>();
for (const s of SOURCES) byTier.set(s.tier, (byTier.get(s.tier) ?? 0) + 1);
console.log(`  ${SOURCES.length} sources, ${SOURCES.length - cited.size} cited by nothing`);
for (const [tier, n] of [...byTier.entries()].sort()) console.log(`    tier ${tier}: ${n}`);

console.log('');
