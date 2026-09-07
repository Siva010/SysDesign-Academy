# Curriculum Architecture

> Working document. This is the design rationale; the machine-readable spine lives in
> `src/content/curriculum.ts` and is the single source of truth the app renders from.

## Design goal

The learner arrives able to program and knowing basic CS. They leave able to *derive* a
design for a system they have never seen, and defend it under pressure.

That means the curriculum is organised around **forces**, not around **technologies**.
A lesson exists because some force (traffic, failure, latency, money, people) breaks the
previous design. The technology is the answer, never the starting point.

## The spine

Nine levels. Each level is defined by *the constraint that dominates it*, and each one ends
with a system that works — and then breaks in a way that motivates the next level.

| Level | Name | Dominant constraint | Ends with |
|---|---|---|---|
| 0 | How Machines Talk | The speed of light and the shape of a request | You can trace a click end to end |
| 1 | One Box | A single machine's limits | A correct single-server app, and its ceiling |
| 2 | Scaling Out | Concurrent load | Stateless tier + LB + cache + CDN + async work |
| 3 | Data at Scale | Storage, correctness, and volume | Indexed, replicated, partitioned data |
| 4 | Coordination | Uncertainty: no shared clock, no reliable network | Quorums, consensus, consistency models |
| 5 | Keeping It Up | Failure as the normal case | SLOs, timeouts, breakers, shedding, DR |
| 6 | Running It | Change, humans, money, adversaries | Deploys, migrations, observability, security, cost |
| 7 | Real Systems | Composition under real requirements | Full case studies with pressure rounds |
| 8 | Judgment | Ambiguity and organisations | Staff-level reasoning, evolution, capstone |

### Why this ordering

Three orderings were considered.

1. **Component-first** (LB → cache → DB → queue → …). Rejected: it teaches vocabulary. The
   learner can name a component but cannot say when *not* to use it.
2. **Case-study-first** (design Twitter on day one). Rejected: without primitives, the learner
   memorises one architecture and cannot transfer it.
3. **Force-first** (chosen). Each level introduces a force; components appear as responses to
   that force, so "when does this stop being the right answer?" is always askable.

### The through-line

Every level re-designs *the same running example* — a link-sharing service — plus its own
domain examples. By Level 7 the learner has watched one system grow from a single Flask
process to a multi-region, sharded, cached, queued, observable platform, and has felt each
step's cost. This is deliberate: transfer comes from watching the *transitions*, not from
seeing finished architectures.

## Module and lesson granularity

- **Level**: 4–8 modules.
- **Module**: 3–7 lessons. A module is a coherent answer to one question
  ("How does data survive a machine dying?").
- **Lesson**: one idea, 12–35 minutes, following the 13-part template (`docs/06-lesson-template.md`).

A lesson is too big if you cannot state its problem in one sentence. A lesson is too small if
it has no failure mode of its own.

## Depth model (§29 of the brief)

The same concept appears at several levels, deepening each time. This is a feature, not
duplication. Example — **consensus**:

| Level | Treatment |
|---|---|
| 2 | "Something has to decide which node is the leader." Named, not explained. |
| 4 | Raft properly: terms, elections, log replication, quorum intersection, safety vs liveness. |
| 5 | Consensus as an *availability liability*: what happens when a quorum is unreachable. |
| 6 | Operating a consensus system: membership changes, disk failure, split brain in practice. |
| 8 | When to buy consensus instead of building it; when to avoid needing it at all. |

The content model supports this with `depth` on each lesson and `deepens: [conceptId]` links,
so a concept page can show its own progression.

## Progressive disclosure inside a lesson (§28)

Six layers, rendered as expandable strata rather than separate pages:

1. **Understand** — the mental model, no jargon.
2. **Build** — how it actually works.
3. **Scale** — behaviour under load.
4. **Break** — failure modes.
5. **Defend** — interview-level trade-offs.
6. **Go deeper** — theory, papers, primary sources.

A beginner reads layers 1–2 and leaves with something true. A staff engineer reads 4–6 of the
same lesson. Neither is served a different page.

## What each lesson must earn

Before a lesson is marked `reviewed` it must answer:

- What breaks without it? (If nothing, delete the lesson.)
- What does it cost — latency, money, operational burden, cognitive load?
- When is it the wrong answer?
- Which real, publicly documented system demonstrates it?
- What does a weak candidate say about it, and why is that weak?

## Assessment placement

- **Per lesson**: 2–4 reasoning checks ("Check yourself"). Never recall-only.
- **Per module**: one applied exercise — find the bottleneck, complete the architecture, or
  predict the failure.
- **Per level**: one design prompt graded against a rubric, plus one "unfamiliar system"
  transfer test.
- **Level 7+**: full timed interview simulations with post-interview reports.

## Coverage map to the brief

The brief's §4 topic list maps onto levels as follows. Every bullet in §4 has a home; the
map is maintained in `src/content/curriculum.ts` and checked by `scripts/validate-content.ts`,
which fails the build if a required topic has no owning lesson.

| Brief section | Level(s) |
|---|---|
| Foundations | 0, 1 |
| Internet and networking | 0 |
| Application architecture | 1, 2, 8 |
| Scaling | 2 |
| Databases | 3 |
| Caching | 2, 3 |
| Messaging and event systems | 2, 4 |
| Distributed systems | 4 |
| Reliability engineering | 5 |
| Storage systems | 3 |
| Search | 3 |
| Observability | 6 |
| Security | 6 |
| Real-world operational architecture | 6 |
| Case studies | 7 |
| Staff-level reasoning | 8 |
