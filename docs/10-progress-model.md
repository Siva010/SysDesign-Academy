# Progress Model

Progress here is a count of **reading passes**, marked by hand, on an expanding revision
interval. There is no skill level, no percentage of understanding, and nothing the application
decides about the learner.

## Why the previous model was removed

The first version inferred a 0–4 mastery level per concept from evidence: reading a lesson
reached 1, passing checks reached 2, using an idea in a case study reached 3, an interview
simulation reached 4. Level 2 decayed after 60 days.

It was coherent and it was wrong in a way worth recording, because the reasoning that produced it
sounds good.

**It reported an opinion as a fact.** "You have applied 41 concepts" is a claim about a person,
derived from which multiple-choice options they clicked, presented with the confidence of a
measurement. The application had no way to know whether any of it was true.

**The evidence did not support the claim.** Answering a four-option question correctly is thin
grounds for "understood", and thinner still for a level that then decays on a schedule nobody
chose. Two learners with identical knowledge could differ by twenty levels depending on how many
checks they happened to click.

**It could not represent re-reading.** The thing people actually do with dense material is go
through it again, and the model had no way to record that a lesson had been read three times. It
could only record that a number had gone up.

**It made the checks strategic.** An assessment that changes a visible score is one people answer
to move the score. The checks are better when they cost nothing.

## The model

One record per lesson or case study:

```ts
interface PassRecord {
  reads: number;      // completed passes
  lastRead: number;   // when the most recent one was
  firstRead: number;
  pace?: 'sooner' | 'later';
}
```

That is the whole stored state. Everything else is derived:

| Derived | From |
|---|---|
| Whether a concept has been met, and how often | The best pass count among lessons teaching it |
| Level progress | Lessons read / lessons in the level |
| What is due | `lastRead + interval(reads)` |
| The revision list | Everything due, ordered by intervals overdue |

Deriving rather than storing means there is one fact and nothing to keep in agreement. Under the
old model a concept could read "understood" while every lesson teaching it was unread, because
the two were separate records that had drifted.

## The rotation

Intervals expand with each pass: **3, 10, 30, 90, 180 days**, then every 180. `sooner` multiplies
the next interval by 0.4 and `later` by 2. Those are the only two controls, and both are the
learner's.

Overdue is a full interval past due rather than a day past. Something on a 90-day interval is not
meaningfully more urgent on day 91, and a list that turns red the moment you look away teaches
people to ignore it.

Urgency for ordering is **intervals overdue**, not days: a lesson read once and due six days ago
(two intervals) outranks one read six times and due twenty days ago (a ninth of an interval).

## Each pass has a job

This is the part that makes a count worth keeping. Re-reading feels useless mostly when the
second pass is performed identically to the first, so the panel names what is different about
this one before you do it:

| Pass | Its job |
|---|---|
| 1 | Read it straight through. Do not stop at what you do not follow yet. |
| 2 | Go to the trade-offs and failure modes — the part everyone skims first time. |
| 3 | Read the headings, reconstruct the argument, *then* read the body. |
| 4 | Read for what has changed in your head since you last worked with this. |
| 5+ | Maintenance. Skim, check the diagram, move on. |

## What is not recorded

Checks record nothing. Interview runs are stored as results but do not feed progress. Nothing is
gated, locked, or unlocked. The prerequisite warning on a lesson is a note about what you have not
read, and never a barrier.

## Storage

`localStorage`, key `sda.progress.v2`, in the browser only. Never transmitted. Exportable and
importable as JSON from `/progress`, which is the only backup that exists — clearing site data
deletes it.

A `v1` record from the previous model is migrated on first load: each read lesson and completed
case study becomes one pass at its recorded timestamp. Per-concept mastery is **discarded** rather
than converted. There is no honest reading of "mastery 3" as a number of passes, and inventing one
would reintroduce exactly the guessing this change removed.

## Implementation

| File | Holds |
|---|---|
| `src/lib/passes.ts` | The schedule and the pass descriptions. Pure: no React, no storage. |
| `src/lib/progress.tsx` | Storage, migration, and the React context. |
| `src/lib/lesson-index.ts` | The derived views — by level, by concept, what is due. |
| `src/components/PassControl.tsx` | The mark-as-read panel, shared by lessons and case studies. |

Lessons live in MDX and are loaded from the filesystem, so client components cannot enumerate
them. Server components pass down a compact `LessonIndexEntry[]` instead of a generated index
being committed, which keeps it impossible for that list to go stale.
