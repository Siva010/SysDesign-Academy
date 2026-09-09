# Assessment Taxonomy

Checks exist to make the learner commit to an answer before reading one. They are self-tests:
nothing they record leaves the page, and no score is derived from them.

That is a change. An earlier version inferred a per-concept mastery level from check answers and
displayed it as progress. It was deleted because the number was the software's opinion, formed
by rules the learner could not see, and a multiple-choice answer is thin evidence for a claim as
large as "you understand this". What the application records now is what it can actually observe:
that you said you read something. See `docs/10-progress-model.md`.

## Question types

| Type | Tests | Grading | Component |
|---|---|---|---|
| predict | Causal reasoning | Choice plus required justification; feedback compares reasoning | `Check` |
| bottleneck | Diagnosis | Identify the limiting resource from a described system | `BottleneckCheck` |
| whatbreaks | Failure imagination | Free response scored against a rubric of named modes | `OpenCheck` |
| estimate | Quantitative judgment | Numeric with tolerance band; assumptions must be stated | `EstimateCheck` |
| tradeoff | Judgment | Choose, and name what you sacrificed | `Check` |
| complete | Architecture composition | Fill the missing component and justify | `CompleteCheck` |
| debug | Operational reasoning | Given symptoms and metrics, name the cause | `DebugCheck` |
| design | Synthesis | Open prompt graded against a rubric | `OpenCheck` |
| transfer | Generalisation | A system the learner has never seen | `TransferCheck` |

What distinguishes the four in `CheckTypes.tsx` from a plain multiple choice is the *material*
presented before the question: a resource table, a set of observations, a pipeline with a hole in
it, or an unfamiliar system. The material is the exercise; the options only capture the answer.

Two details are deliberate. `DebugCheck` reveals observations on request and reports how many were
used, because choosing which evidence to ask for is part of diagnosis and an incident charges you
minutes for each one. `TransferCheck` asks the learner to recognise a
familiar problem in an unfamiliar system, which is the only one of these that tests whether an
idea has generalised rather than whether it was remembered.

Recall and definition questions are not used. If a fact matters, it lives in the glossary.

## Feedback contract

Never "correct / incorrect". Every response returns three parts:

1. **What your answer implies** - the model behind it, stated back.
2. **Why it works or fails** - mechanism, not verdict.
3. **What a stronger candidate would add** - the next level of the same answer.

## What checks do not do

Checks do not feed progress, unlock anything, or gate a lesson. A wrong answer costs nothing but
the information it gives you, which is the point: an assessment that changes a score is one people
answer strategically, and this curriculum is read by the person being assessed.

The one place a check should change behaviour is the schedule, and that is left to the learner.
If a check goes badly, the control at the end of the lesson brings the next pass **sooner**. That
decision is theirs to make and reverse, rather than something inferred on their behalf.

## Progress

Progress is a count of reading passes with an expanding revision interval, described in
`docs/10-progress-model.md`. The recommender at `/next` ranks:

1. What is due for another pass, most overdue first, measured in intervals rather than days.
2. The next unread lesson in curriculum order, noting any prerequisite you have not read.
3. Lessons matching a stated goal, which reorders and hides nothing.

Every recommendation states its reason, because a recommender that cannot explain itself is a
shuffled table of contents.
