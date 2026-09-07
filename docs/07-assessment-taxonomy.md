# Assessment and Mastery Taxonomy

Clicking "complete" is not evidence of anything (§35). Mastery is inferred from what the
learner can *do*.

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
minutes for each one. `TransferCheck` records against the case-study context rather than the
exercise context, because generalising to an unseen system is the only evidence that justifies
mastery level 4.

Recall and definition questions are not used. If a fact matters, it lives in the glossary.

## Feedback contract

Never "correct / incorrect". Every response returns three parts:

1. **What your answer implies** - the model behind it, stated back.
2. **Why it works or fails** - mechanism, not verdict.
3. **What a stronger candidate would add** - the next level of the same answer.

## Mastery model

Per concept, mastery is a 0-4 level that decays over time:

| Level | Meaning | Evidence required |
|---|---|---|
| 0 | Unseen | none |
| 1 | Encountered | Lesson read |
| 2 | Understood | Reasoning checks passed |
| 3 | Applied | Correct use inside an unfamiliar exercise |
| 4 | Transferred | Correct use in a case study or interview sim not tied to the lesson |

Only levels 3-4 count toward the level completion gate. Level 2 decays after 60 days without
reinforcement, which drives spaced re-surfacing in "what to learn next".

## Recommendation engine (§34)

Next-step ranking, in order:

1. Concepts with an unmet prerequisite blocking something the learner has attempted.
2. Concepts at mastery 2 that have decayed.
3. Concepts on the shortest path to the learner's stated goal, chosen at onboarding.
4. The next lesson in curriculum order.

Every recommendation states its reason: "because you understand X but are missing Y".
