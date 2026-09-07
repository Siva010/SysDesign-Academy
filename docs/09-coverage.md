# Coverage: what exists, what does not

Honest accounting, so that nobody has to discover a gap by clicking into it.

## Built and working

**The system** is complete. Every surface described in the brief's section 44 exists and is
functional:

| Surface | State |
|---|---|
| Curriculum with 9 levels and 36 modules | Complete; 50 lessons across 35 of 36 modules |
| Concept graph, 297 concepts | Complete, **all taught by at least one lesson**, with a per-concept neighbourhood diagram |
| Lesson reader with the 13-section template | Complete, with progressive disclosure |
| Pattern library | 14 patterns, each with the full 9-section shape |
| Case studies with pressure rounds | 9 written; **all 11 primitive signatures covered** |
| Failure library | 10 incident walkthroughs, cross-linked from the lessons that motivate them |
| Decision tables | 12, interactive, constraint → consequence → choice |
| Estimation toolkit | 4 presets, adjustable assumptions, interpretation |
| Conceptual search | Symptom expansion (32 phrases) + text retrieval + concept boosting |
| Interview method | Complete reference page |
| Interview simulator | 4 scenarios, branching, with a scored debrief |
| Assessment types | 7 of the 9 in the taxonomy, 14 worked instances across 9 levels |
| Progress and mastery | Evidence-based, decaying, per-concept |
| Recommender | Explains every recommendation |
| Sources and evidence page | 60+ sources with tiers and scope |
| Glossary, myths | Derived from the concept graph |

**Content written:** 50 lessons, 14 patterns, 9 case studies, 10 failure walkthroughs, 12 decision
tables, 4 interview scenarios, 32 symptom mappings, 297 concepts, 60+ registered sources.

## Lessons per level

| Level | Modules | Lessons | Note |
|---|---|---|---|
| 0 — How Machines Talk | 4 | 7 | Complete |
| 1 — One Box | 4 | 5 | Complete |
| 2 — Scaling Out | 4 | 5 | Complete |
| 3 — Data at Scale | 5 | 9 | Complete |
| 4 — Coordination | 4 | 6 | Complete |
| 5 — Keeping It Up | 4 | 6 | Complete |
| 6 — Running It | 4 | 5 | Complete |
| 7 — Real Systems | 3 | 2 | Third module indexes the case study library |
| 8 — Judgment | 4 | 5 | Complete |

Every module has content. Level 7's `l7-library` module is a library index by design rather than
a gap: its `library: 'case-studies'` field makes the level page render the case studies.

## Cross-linking

The failure library covers ten incidents across all seven categories. Every one is reachable from
the lessons that motivate it: a lesson's `failures:` and `patterns:` frontmatter now renders in the
lesson rail, so the idea and the way it goes wrong in production are one click apart rather than a
search apart. Twenty-six lessons carry these links.

## Case studies by primitive signature

All eleven signatures from `docs/06-case-study-taxonomy.md` now have at least one worked example,
which is what makes the index by signature usable rather than aspirational.

| Signature | Case study |
|---|---|
| id-generation | URL shortener |
| fanout | Social feed, URL shortener |
| hot-key | Proximity matching, Search and autocomplete, Social feed, Ticket booking, URL shortener |
| exactly-once-effect | Job scheduler, Real-time attribution, Ticket booking |
| inventory-contention | Ticket booking |
| large-object | File sync, Social feed |
| search-index | Search and autocomplete |
| geo-index | Proximity matching |
| time-series-ingest | Metrics platform |
| scheduling | Job scheduler |
| stream-join | Real-time attribution |

## Every concept is taught

The validator's standing warning is gone: all 297 concepts in the graph are now taught by at
least one lesson. The last three were closed deliberately rather than by padding —
`block-storage`, `geospatial-index` and `chunking` in a Level 3 lesson about data whose shape is
not a row; `control-plane-vs-data-plane` in a Level 8 lesson about which half of a system is
allowed to fail; and `paxos` and `byzantine-failure` in the consensus lesson, where what is taught
is the boundary rather than the protocol — why Raft is presented instead of Paxos, and why
Byzantine fault tolerance is a threat-model decision rather than a difficulty one.

`npx tsx scripts/untaught.ts` now prints nothing, and that is the check to run before adding a
concept.

## Known gaps, in priority order

**1. Assessment types.** Seven of the nine in `docs/07-assessment-taxonomy.md` are implemented:
`predict` and `tradeoff` via `Check`, `whatbreaks` and `design` via `OpenCheck`, `estimate` via
`EstimateCheck`, and `bottleneck`, `debug`, `complete` and `transfer` via the components in
`CheckTypes.tsx`. The four newer types now have 14 instances between them, spread from Level 1 to
Level 8. What remains unimplemented is a rubric-graded free-response `design` question distinct
from `OpenCheck`, which would need a grading model rather than a self-scored rubric.

**2. Interview simulator scenarios.** Four exist — URL shortener, payments, dispatch, metrics. The
format supports more; each is a data file and takes no code changes.

**3. Concept graph visualisation.** Each concept page now carries a local-neighbourhood diagram:
what it requires on the left, what it leads to on the right, and what it trades against below on a
dashed line. The layout is deterministic rather than force-directed, so the same concept always
produces the same picture, and every node links.

There is still no *whole-graph* explorer, and that remains a deliberate omission. A physics layout
of 297 nodes is a hairball that looks like insight and answers no question. What a learner wants is
the shape immediately around where they are standing, which is what the neighbourhood view gives
them.

## Deliberate omissions

**No LLM-backed interview simulator.** The simulator is a scripted branching interviewer and the
page says so plainly. Adding a model-backed one would require an API key and a backend, and would
make the site non-static. The scripted version is honest about what it is and works offline.

**No precise latency table.** The estimation toolkit deliberately omits a table of device
latencies. Those figures change with hardware generations, and quoting a stale one with
confidence is worse than reasoning in orders of magnitude. The reasoning is explained on the page
rather than left implicit.

**No user accounts.** Progress is in `localStorage`, with export and import. This is stated on the
progress page, including the consequence that clearing site data loses it.

**No vector or semantic retrieval in the search case study.** Named as out of scope inside the
study, with the reason: it does not remove the lexical path, and it changes the freshness and cost
profile enough to be its own design rather than a paragraph.

## How to extend it

Adding a lesson: create `content/lessons/level-N/some-id.mdx` with valid frontmatter, run
`npm run validate:content`, and it appears in the curriculum, the concept pages, the search index
and the recommender. No code change.

Adding a case study, pattern or failure: same, in the corresponding directory.

Adding an interview scenario: a data file in `src/content/interviews/`, registered in that
directory's `index.ts`.

Adding a concept: an entry in the relevant file under `src/content/concepts/`, plus a level
assignment in `src/content/level-concepts.ts` if the cluster default is wrong for it.

Checking what is still untaught: `npx tsx scripts/untaught.ts` lists concepts with no lesson,
grouped by the level that owns them.
