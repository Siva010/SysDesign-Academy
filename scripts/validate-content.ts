/**
 * Content validator. Run with `npm run validate:content`.
 *
 * These are the invariants from docs/04-content-taxonomy.md. They exist because content
 * of this size drifts silently: a renamed concept leaves dangling edges, a lesson claims a
 * prerequisite that no longer exists, a "fact" loses its citation.
 *
 * Exit code 1 on any error. Warnings do not fail the run but are printed.
 */
import { CONCEPTS, CONCEPT_BY_ID } from '../src/content/concepts';
import { SOURCES, SOURCE_BY_ID } from '../src/content/sources';
import { LEVELS, MODULES } from '../src/content/curriculum';
import { SYMPTOMS } from '../src/content/symptoms';
import { DECISIONS } from '../src/content/decisions';
import { PRIMITIVE_SIGNATURES } from '../src/lib/types';
import {
  loadAllCaseStudies,
  loadAllFailures,
  loadAllLessons,
  loadAllPatterns,
} from '../src/lib/content-node';

const errors: string[] = [];
const warnings: string[] = [];

const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

/* ---------------------------------------------------------------- concepts */

const conceptIds = new Set(CONCEPTS.map((c) => c.id));

if (conceptIds.size !== CONCEPTS.length) {
  const seen = new Set<string>();
  for (const c of CONCEPTS) {
    if (seen.has(c.id)) err(`duplicate concept id: ${c.id}`);
    seen.add(c.id);
  }
}

for (const c of CONCEPTS) {
  const edges: [string, string[]][] = [
    ['requires', c.requires ?? []],
    ['leadsTo', c.leadsTo ?? []],
    ['tensionWith', c.tensionWith ?? []],
  ];
  for (const [kind, ids] of edges) {
    for (const id of ids) {
      if (!conceptIds.has(id)) err(`concept "${c.id}" ${kind} unknown concept "${id}"`);
      if (id === c.id) err(`concept "${c.id}" ${kind} itself`);
    }
  }
  if ((c.requires ?? []).length > 4) {
    warn(`concept "${c.id}" has ${c.requires!.length} hard prerequisites (budget is 4)`);
  }
  if (c.myth && !c.mythCorrection) err(`concept "${c.id}" has a myth with no correction`);
  if (c.oneLiner.length > 200) warn(`concept "${c.id}" oneLiner is ${c.oneLiner.length} chars`);
}

/* prerequisite graph must be acyclic */
{
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const colour = new Map<string, number>(CONCEPTS.map((c) => [c.id, WHITE]));
  const stack: string[] = [];

  const visit = (id: string): void => {
    if (colour.get(id) === BLACK) return;
    if (colour.get(id) === GREY) {
      const from = stack.indexOf(id);
      err(`prerequisite cycle: ${[...stack.slice(from), id].join(' -> ')}`);
      return;
    }
    colour.set(id, GREY);
    stack.push(id);
    for (const req of CONCEPT_BY_ID[id]?.requires ?? []) visit(req);
    stack.pop();
    colour.set(id, BLACK);
  };

  for (const c of CONCEPTS) visit(c.id);
}

/* ---------------------------------------------------------------- curriculum */

const moduleIds = new Set(MODULES.map((m) => m.id));
for (const level of LEVELS) {
  for (const mid of level.moduleIds) {
    if (!moduleIds.has(mid)) err(`level "${level.id}" references unknown module "${mid}"`);
  }
}
for (const m of MODULES) {
  if (!LEVELS.some((l) => l.id === m.levelId)) {
    err(`module "${m.id}" references unknown level "${m.levelId}"`);
  }
  if (!LEVELS.some((l) => l.moduleIds.includes(m.id))) {
    err(`module "${m.id}" is not listed by its level "${m.levelId}"`);
  }
}

/* ---------------------------------------------------------------- lessons */

const lessons = loadAllLessons();
const lessonIds = new Set(lessons.map((l) => l.id));

for (const lesson of lessons) {
  const where = `lesson "${lesson.id}"`;

  if (!moduleIds.has(lesson.module)) err(`${where} references unknown module "${lesson.module}"`);

  const level = LEVELS.find((l) => l.index === lesson.level);
  if (!level) err(`${where} has level ${lesson.level}, which does not exist`);
  else {
    const mod = MODULES.find((m) => m.id === lesson.module);
    if (mod && mod.levelId !== level.id) {
      err(`${where} is level ${lesson.level} but module "${lesson.module}" belongs to ${mod.levelId}`);
    }
  }

  for (const p of lesson.prerequisites) {
    if (!lessonIds.has(p) && !conceptIds.has(p)) {
      err(`${where} prerequisite "${p}" is neither a lesson nor a concept`);
    }
  }
  for (const c of lesson.concepts) {
    if (!conceptIds.has(c)) err(`${where} teaches unknown concept "${c}"`);
  }
  for (const c of lesson.unlocks) {
    if (!conceptIds.has(c) && !lessonIds.has(c)) {
      err(`${where} unlocks unknown "${c}"`);
    }
  }
  for (const s of lesson.sources) {
    if (!SOURCE_BY_ID[s]) err(`${where} cites unknown source "${s}"`);
  }
  if (lesson.prerequisites.length > 4 && !lesson.prereqOverride) {
    warn(`${where} has ${lesson.prerequisites.length} prerequisites and no prereqOverride note`);
  }
  if (lesson.status === 'reviewed') {
    for (const required of ['## The problem', '## Failure modes', '## Trade-offs', '## Check yourself']) {
      if (!lesson.body.includes(required)) {
        err(`${where} is marked reviewed but is missing the "${required.replace('## ', '')}" section`);
      }
    }
  }
  if (lesson.summary.length > 160) warn(`${where} summary is ${lesson.summary.length} chars`);
}

/* every concept must be taught somewhere (warn while the curriculum is being written) */
{
  const taught = new Set(lessons.flatMap((l) => l.concepts));
  const untaught = CONCEPTS.filter((c) => !taught.has(c.id));
  if (untaught.length > 0) {
    warn(
      `${untaught.length} concepts are not yet taught in any lesson (first 12: ${untaught
        .slice(0, 12)
        .map((c) => c.id)
        .join(', ')})`,
    );
  }
}

/* lesson ordering must be unique within a module */
{
  const byModule = new Map<string, Map<number, string>>();
  for (const l of lessons) {
    const m = byModule.get(l.module) ?? new Map<number, string>();
    const clash = m.get(l.order);
    if (clash) err(`lessons "${clash}" and "${l.id}" share order ${l.order} in module "${l.module}"`);
    m.set(l.order, l.id);
    byModule.set(l.module, m);
  }
}

/* ---------------------------------------------------------------- patterns, cases, failures */

const patterns = loadAllPatterns();
const caseStudies = loadAllCaseStudies();
const failures = loadAllFailures();

const patternIds = new Set(patterns.map((p) => p.id));

const checkRefs = (
  where: string,
  refs: { concepts?: string[]; sources?: string[]; patterns?: string[]; prerequisites?: string[] },
) => {
  for (const c of refs.concepts ?? []) {
    if (!conceptIds.has(c)) err(`${where} references unknown concept "${c}"`);
  }
  for (const s of refs.sources ?? []) {
    if (!SOURCE_BY_ID[s]) err(`${where} cites unknown source "${s}"`);
  }
  for (const p of refs.patterns ?? []) {
    if (!patternIds.has(p)) err(`${where} references unknown pattern "${p}"`);
  }
  for (const p of refs.prerequisites ?? []) {
    if (!lessonIds.has(p) && !conceptIds.has(p)) {
      err(`${where} prerequisite "${p}" is neither a lesson nor a concept`);
    }
  }
};

for (const p of patterns) {
  const where = `pattern "${p.id}"`;
  checkRefs(where, p);
  for (const r of p.relatedPatterns ?? []) {
    if (!patternIds.has(r)) err(`${where} relates to unknown pattern "${r}"`);
  }
  if (p.status === 'reviewed') {
    for (const required of ['## Problem', '## Pattern', '## Costs', '## When NOT to use it']) {
      if (!p.body.includes(required)) {
        err(`${where} is reviewed but missing the "${required.replace('## ', '')}" section`);
      }
    }
  }
}

for (const c of caseStudies) {
  const where = `case study "${c.id}"`;
  checkRefs(where, c);
  if (c.signatures.length === 0) err(`${where} has no primitive signature`);
  if (c.status === 'reviewed') {
    for (const required of ['## Estimate', '## Pressure rounds', '## What breaks', '## What we did NOT build']) {
      if (!c.body.includes(required)) {
        err(`${where} is reviewed but missing the "${required.replace('## ', '')}" section`);
      }
    }
    const rounds = (c.body.match(/^### Round /gm) ?? []).length;
    if (rounds < 6) err(`${where} has ${rounds} pressure rounds; the taxonomy requires at least 6`);
  }
}

for (const f of failures) {
  checkRefs(`failure "${f.id}"`, f);
}

/* MDX authoring hazards that only surface at build time */
for (const doc of [...lessons, ...patterns, ...caseStudies, ...failures]) {
  const nestedQuote = /\s(title|caption|prompt|about)="[^"\n]*"[^"\n=/>]*"/.exec(doc.body);
  if (nestedQuote) {
    err(
      `${doc.filePath} has a nested double quote inside an MDX attribute, which fails to compile: ${nestedQuote[0].slice(0, 60)}`,
    );
  }
}

/* ---------------------------------------------------------------- symptoms & decisions */

for (const s of SYMPTOMS) {
  for (const c of s.concepts) {
    if (!conceptIds.has(c)) err(`symptom "${s.phrase}" references unknown concept "${c}"`);
  }
  if (s.concepts.length === 0) err(`symptom "${s.phrase}" resolves to nothing`);
}

for (const d of DECISIONS) {
  const optionIds = new Set(d.options.map((o) => o.id));
  for (const crit of d.criteria) {
    for (const oid of optionIds) {
      if (!(oid in crit.values)) {
        err(`decision "${d.id}" criterion "${crit.criterion}" is missing option "${oid}"`);
      }
    }
    if (crit.favours && !optionIds.has(crit.favours)) {
      err(`decision "${d.id}" criterion "${crit.criterion}" favours unknown option "${crit.favours}"`);
    }
  }
  for (const rule of d.rules) {
    if (!optionIds.has(rule.choose)) {
      err(`decision "${d.id}" rule chooses unknown option "${rule.choose}"`);
    }
  }
  for (const c of d.concepts) {
    if (!conceptIds.has(c)) err(`decision "${d.id}" references unknown concept "${c}"`);
  }
  for (const s of d.sources) {
    if (!SOURCE_BY_ID[s]) err(`decision "${d.id}" cites unknown source "${s}"`);
  }
}

/* ------------------------------------------------------- reachability and coverage

   Everything above checks that a reference resolves. These check the other direction: that
   each thing the curriculum promises to cover is actually reached by something. Both failure
   modes are silent - a concept with no lesson still renders its own page, an unreferenced
   failure still sits in the failure index - so nothing surfaces them except a check like this.

   Each of these was verified by hand at some point, which is exactly the reason to encode it:
   a hand check is true on the day it is run and says nothing about the next commit. */

const taughtConcepts = new Set(lessons.flatMap((l) => l.concepts ?? []));
for (const c of CONCEPTS) {
  if (!taughtConcepts.has(c.id)) {
    err(`concept "${c.id}" is taught by no lesson; every concept needs a home (see npm run untaught)`);
  }
}

const linkedFailures = new Set(lessons.flatMap((l) => l.failures ?? []));
for (const f of failures) {
  if (!linkedFailures.has(f.id)) {
    err(`failure "${f.id}" is linked from no lesson, so it is reachable only from the failure index`);
  }
}

const linkedPatterns = new Set([
  ...lessons.flatMap((l) => l.patterns ?? []),
  ...caseStudies.flatMap((c) => c.patterns ?? []),
]);
for (const p of patterns) {
  if (!linkedPatterns.has(p.id)) {
    err(`pattern "${p.id}" is linked from no lesson or case study`);
  }
}

const signatureCount = new Map(PRIMITIVE_SIGNATURES.map((s) => [s, 0]));
for (const c of caseStudies) {
  for (const sig of c.signatures) signatureCount.set(sig, (signatureCount.get(sig) ?? 0) + 1);
}
for (const [sig, n] of signatureCount) {
  if (n === 0) err(`primitive signature "${sig}" has no case study`);
  /* One example teaches the instance; two teach the pattern. Transfer is the claim the case-study
     taxonomy makes, and a single worked example does not support it. A warning rather than an
     error, so a newly introduced signature can be authored before its second study exists. */
  else if (n === 1) warn(`primitive signature "${sig}" has only one case study; transfer needs two`);
}

/* The bibliography page states that where a detail is publicly documented it is cited. A source
   nothing draws on makes that claim slightly false and pads the list with breadth-signalling. */
const citedSources = new Set(
  [...lessons, ...caseStudies, ...patterns, ...failures].flatMap((x) => x.sources ?? []),
);
for (const s of SOURCES) {
  if (!citedSources.has(s.id)) err(`source "${s.id}" is cited by nothing; cite it or remove it`);
}

/* ---------------------------------------------------------------- report */

console.log(`concepts: ${CONCEPTS.length}`);
console.log(`lessons:  ${lessons.length}`);
console.log(`patterns: ${patterns.length}, case studies: ${caseStudies.length}, failures: ${failures.length}`);
console.log(`levels:   ${LEVELS.length}, modules: ${MODULES.length}`);
console.log(`decisions: ${DECISIONS.length}, symptoms: ${SYMPTOMS.length}`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ~ ${w}`);
}

if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  x ${e}`);
  process.exit(1);
}

console.log('\ncontent OK');
