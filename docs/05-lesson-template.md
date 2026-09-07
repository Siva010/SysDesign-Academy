# Lesson Template

Thirteen sections (§15), rendered in a fixed order so the learner always knows where they are.
Sections 1-4 are always visible; 5-13 are strata the reader can open (§28).

| # | Section | Component | Must contain |
|---|---|---|---|
| 1 | The problem | prose | A concrete situation that hurts. No terminology yet. |
| 2 | Intuition | prose | The mental model in plain language a 15-year-old follows. |
| 3 | Concrete example | Example | Something familiar, with real numbers. |
| 4 | Formal explanation | prose | The actual terminology, defined precisely. |
| 5 | Architecture | Diagram | Where it sits, and why the box exists. |
| 6 | Scaling | ScaleTable | Behaviour at 10x, 100x, 1000x. |
| 7 | Failure modes | WhatBreaks | At least 3 named modes: symptom, cause, mitigation. |
| 8 | Trade-offs | TradeOff | The 9-field structure from §7. |
| 9 | Real-world | RealWorld | Cited, tier 1-3, with claim labels. |
| 10 | Interview view | InterviewLens | What is actually being tested; depth expected. |
| 11 | Common mistakes | Mistakes | What a weak answer says, and why it is weak. |
| 12 | Check yourself | Check | Reasoning questions with graded feedback, never recall. |
| 13 | Further depth | GoDeeper | Primary sources and the next lesson in the chain. |

## Rules

- **Section 1 may not name a technology.** If the problem cannot be stated without naming the
  solution, the lesson is mis-scoped.
- **Section 7 is mandatory.** A component with no failure modes has not been understood.
- **Section 8 must include "When should we NOT use it?"** - the highest-value field in the brief.
- **Section 12 answers explain why it works and what a stronger candidate would add** (§18).
  No bare correct/incorrect.

## The TradeOff structure (§7)

Nine required fields: decision, options, why-this-one, gain, sacrifice, failure-modes,
operational-burden, cost, when-not-to-use. The schema rejects a partial trade-off block.
