# System Design Academy

A production-grade system design curriculum, built as a web application.

The goal is not to teach answers to interview questions. It is to teach the reasoning that the
questions are trying to test, so that an unfamiliar prompt becomes tractable rather than
memorised.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Other commands:

```bash
npm run build             # static export to out/
npm run preview           # serve out/ exactly as a static host will
npm run typecheck         # tsc --noEmit
npm run validate:content  # content invariants; fails the build on a broken reference
npm run untaught          # concepts with no lesson yet, grouped by level
```

## Deploying

The whole site is static. Every dynamic route has a `generateStaticParams`, the one route
handler is `force-static`, and nothing reads cookies, headers or search params on the server, so
`npm run build` writes plain files to `out/` and there is nothing to run in production.

That is a deliberate property rather than a coincidence. It means the site is served from a CDN
with no origin, no server runtime, no cold starts and nothing to patch — and the only stateful
thing in the product, a learner's progress, lives in their own browser.

**Cloudflare** is the recommended host, deployed as a Worker that serves static assets and
runs no code. `wrangler.jsonc` in the repository root declares exactly that:

```jsonc
"assets": {
  "directory": "./out",
  "html_handling": "force-trailing-slash",
  "not_found_handling": "404-page"
}
```

That file is not optional, and the reason is worth knowing. With no Wrangler configuration
present, `wrangler deploy` inspects the repository, recognises Next.js, and runs the OpenNext
adapter — which builds a server bundle from `.next/standalone`. There is no server here, so the
adapter finds nothing and the deploy fails *after* a build that succeeded, which is a confusing
place to fail. Declaring the project explicitly stops the guessing.

Dashboard settings:

| Setting | Value |
|---|---|
| Build command | `npm run validate:content && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | from `.nvmrc` |

Putting the content validator ahead of the build is the point of having written it: a dangling
concept reference or a missing lesson section fails the deploy rather than reaching production.

Wrangler is pinned as a devDependency so the deploy uses a known version rather than whatever
`npx` resolves that morning.

`public/_headers` sets caching and security headers, and Cloudflare reads it from the assets
directory. Hashed build assets get a one-year immutable lifetime; HTML revalidates every time, so
a deploy is visible immediately and no stale document can reference an asset that no longer
exists.

The Content-Security-Policy allows `'unsafe-inline'` for scripts, which is worth being honest
about: Next.js inlines its hydration payload and the no-flash theme script, and a static export
cannot issue per-request nonces. The site renders no user input and loads nothing from a third
party, so the practical exposure is small — but it is a real weakening, not a strong policy.

Any other static host works the same way: point it at `out/`. Only `wrangler.jsonc` and the
`_headers` syntax are Cloudflare-specific.

`npm run validate:content` should be run before committing content. It catches dangling concept
references, prerequisite cycles, missing lesson sections, unknown source citations, and the MDX
authoring hazards that otherwise only surface at build time.

## How it is organised

```
public/             files copied verbatim into the build output (_headers)
content/            MDX content, validated by frontmatter schema
  lessons/          the curriculum, by level
  patterns/         reusable architectural patterns
  case-studies/     full derivations with pressure rounds
  failures/         incident-shaped failure walkthroughs
docs/               design documents: curriculum architecture, taxonomies, source rules
scripts/            content validator
src/
  app/              Next.js App Router pages
  components/       UI and MDX component library
  content/          structured content: concepts, curriculum, sources, decisions, interviews
  lib/              content loading, search, progress, types
```

### Content is data, not pages

Nothing in this project is a hardcoded page. Every surface is derived from typed entities:

| Entity | Where | Why there |
|---|---|---|
| Concept | `src/content/concepts/` | A graph node queried from many surfaces; needs type safety |
| Level, Module | `src/content/curriculum.ts` | Small, highly relational |
| Lesson, Pattern, Case study, Failure | `content/**.mdx` | Long prose with typed frontmatter |
| Decision table | `src/content/decisions.ts` | Tabular; rendered as an interactive comparator |
| Source | `src/content/sources.ts` | Registry referenced by id from every citation |
| Symptom | `src/content/symptoms.ts` | Powers conceptual search |
| Interview scenario | `src/content/interviews/` | Behaviour, not prose |
| Progress | `localStorage` | Per-learner, client only, no account |

Adding a lesson means adding an MDX file with valid frontmatter. The curriculum page, the
concept graph, the search index, the recommender and the progress model all pick it up.

## The design rules this project follows

These are enforced by the validator, by the type system, or by review. They are documented in
full in `docs/`.

**Every claim carries its evidence.** `<Claim label="fact" source="rfc9111">` renders a visible
chip. Six labels: fact, convention, recommendation, simplification, inference, speculation. A
`fact` requires a tier 1–2 source. `speculation` may never be attached to a claim about a real
company's architecture.

**Company architectures are never invented.** Case studies carry a standing notice that they are
pedagogical approximations. Where something is publicly documented it is cited; everything else
is presented as reasonable engineering design and labelled as such.

**No invented benchmarks.** Numbers are cited measurements, physical constants, or stated
assumptions the reader can change in the estimator.

**Every lesson has a failure section and a "when NOT to use it".** Enforced for `status:
reviewed` by the validator. A component with no failure modes has not been understood.

**Every pattern names when it is the wrong choice.** Also enforced.

**Every case study has at least six pressure rounds.** Also enforced.

**Every primitive signature has a worked example.** The case study library is indexed by the
underlying problem rather than by company, and all eleven signatures in
`docs/06-case-study-taxonomy.md` are covered. That is what makes an unfamiliar prompt tractable:
ride-hailing and food delivery are the same geospatial problem with different nouns.

**Every concept in the graph is taught by a lesson.** All 297 of them. `npx tsx scripts/untaught.ts`
prints nothing, and it is the check to run before adding a concept. Where a concept is deliberately
not pursued in depth — Paxos, Byzantine fault tolerance — the lesson teaches the boundary: what it
is, and why this curriculum takes a different route.

## Content model invariants

Checked by `scripts/validate-content.ts`:

1. Every concept edge resolves to a real concept, and no concept requires itself.
2. The prerequisite graph is acyclic.
3. Every lesson prerequisite resolves to a lesson or a concept.
4. Every cited source id exists in the registry.
5. Reviewed lessons contain the required sections.
6. Reviewed patterns contain "When NOT to use it".
7. Reviewed case studies have six or more pressure rounds and an estimate.
8. Lesson order is unique within a module.
9. No nested double quotes inside MDX attributes (a build-time failure otherwise).

Warnings, which do not fail the run: concepts not yet taught in a lesson (currently none),
summaries over 160 characters, and concepts with more than four hard prerequisites.

## Notable implementation details

**The concept graph is shown locally, never globally.** Each concept page renders its immediate
neighbourhood as a deterministic three-band diagram — requires, the concept, leads-to, with
tensions on a dashed line below. There is no force-directed view of all 297 nodes, because a
hairball looks like insight and answers no question.

**Diagrams are declared, not drawn.** `<Arch columns={...} edges={...} stages={...} />` lays out
an SVG from intent. Stages implement progressive disclosure: hidden columns collapse and edges
bridge over hidden nodes, so an early stage shows a connected diagram rather than orphaned boxes.

**Search is conceptual.** A query is expanded through a symptom table before text retrieval, so
"database gets slow" surfaces indexing, query plans, connection pools and hot partitions. The
index is built at build time and fetched on first use.

**Failures are cross-linked from the lessons that motivate them.** A lesson's `failures:` and
`patterns:` frontmatter renders in its rail, so the idea and the incident it causes are one click
apart. A lesson that names a failure is claiming *this is how this goes wrong in production*,
which is worth stating as data rather than as prose.

**The interview simulator is a scripted branching interviewer**, not a language model — and the
page says so. It escalates when answers are strong and returns to fundamentals when they are
weak, then produces a per-dimension report.

**Mastery is evidence-based.** Reading a lesson reaches level 1. Levels 3 and 4 require using a
concept where it was not being taught. Level 2 decays after 60 days without reinforcement.

**Estimators are presets, not prose.** `<Estimator preset="traffic" />` renders adjustable
assumptions and derived values, with the decisive rows highlighted and an interpretation section
saying what each result means for the design.

**Assessments test reasoning, never recall.** Seven of the nine types in the assessment taxonomy
are implemented. Beyond multiple choice, `<BottleneckCheck>` gives a resource table and asks which
component is the ceiling; `<DebugCheck>` reveals observations one at a time and reports how much
evidence you needed; `<CompleteCheck>` shows a pipeline with a hole in it; `<TransferCheck>`
presents a system the reader has never seen and asks which known problems it is made of. All of
them return the same three-part feedback and none of them ever say "correct".

## Where the content stands

See `docs/09-coverage.md` for what is written, what is stubbed, and what a next pass should cover.
