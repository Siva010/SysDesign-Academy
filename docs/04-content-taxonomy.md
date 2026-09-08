# Content Taxonomy & Data Model

Content is **structured data**, not a pile of pages (§40). Entities and their storage:

| Entity | Storage | Why |
|---|---|---|
| Level, Module | `src/content/curriculum.ts` | Small, highly relational, needs type safety |
| Concept | `src/content/concepts.ts` | Graph node; queried from many surfaces |
| Lesson | `content/lessons/**.mdx` | Long prose; MDX with typed frontmatter |
| Pattern | `content/patterns/*.mdx` | Fixed 9-section shape (§30) |
| Case study | `content/case-studies/*.mdx` | Long, with structured rounds and estimates |
| Failure | `content/failures/*.mdx` | Incident-shaped narratives (§22) |
| Decision | `src/content/decisions.ts` | Tabular; rendered as an interactive comparator |
| Question / Exercise | frontmatter + `src/content/assessments.ts` | Needs grading logic |
| Interview scenario | `src/content/interviews/*.ts` | Behaviour, not prose |
| Source | `src/content/sources.ts` | Registry, referenced by id |
| Symptom | `src/content/symptoms.ts` | Powers conceptual search |
| Progress (reading passes) | `localStorage` via `src/lib/progress` | Per-learner, client only |

## Invariants (enforced by `scripts/validate-content.ts`)

1. Every lesson prerequisite resolves to a real lesson or concept.
2. The prerequisite graph is acyclic.
3. Every concept is taught in at least one lesson.
4. Every factual claim has a resolvable source.
5. Every brief topic maps to at least one lesson (coverage table).
6. No lesson exceeds 4 hard prerequisites without an explicit override note.
7. Every case study has at least 6 pressure rounds and a full estimate block.
8. Every pattern has all 9 required sections, including **When not to use**.

## Frontmatter contract (lessons)

    id: caching-and-staleness
    title: Caching, and the Price You Pay for It
    level: 2
    module: reducing-work
    order: 3
    summary: A cache is a bet that the world changes slower than you read it.
    difficulty: core          # intro | core | advanced | staff
    minutes: 28
    prerequisites: [http-caching, single-db-limits]
    concepts: [cache-aside, ttl, cache-invalidation, staleness]
    unlocks: [cache-stampede, hot-keys]
    patterns: [cache-aside, write-through]
    failures: [cache-stampede-incident]
    sources: [rfc9111, aws-builders-caching]
    status: reviewed
