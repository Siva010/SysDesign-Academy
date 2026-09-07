# Case Study Taxonomy

A case study is not "here is the architecture of X". It is a **derivation** the learner can
replay, plus an escalating interviewer (§10) that forces evolution rather than restart.

## Fixed shape

1. **The ask** - the one-line prompt, as an interviewer would give it (deliberately vague).
2. **Clarify** - the questions a strong candidate asks first, and why each changes the design.
3. **Requirements** - functional, non-functional, and explicitly out of scope.
4. **Estimate** - full back-of-envelope with every assumption named and adjustable (§6).
5. **Data model** - entities, access patterns, and the decision each access pattern forces.
6. **Design v1** - the simplest thing that satisfies the stated requirements. Deliberately small.
7. **Pressure rounds** - 8 to 12 escalations. Each shows: new constraint, what breaks,
   the minimal change, the new cost.
8. **What breaks** - component-by-component failure walk (§11).
9. **Trade-off ledger** - every decision, in the 9-field structure.
10. **Cost** - rough infrastructure and operational cost, and what a cheaper design sacrifices.
11. **What we did NOT build** - and why. (Anti-cargo-cult, §12.)
12. **Evidence** - what is publicly documented, what is reasonable design, what is speculation.

## Primitive signatures

Every case study is tagged with the underlying problems it is really testing. This is what
makes unfamiliar problems tractable (§20).

| Signature | Meaning | Examples | Worked in |
|---|---|---|---|
| id-generation | Unique IDs at scale without coordination | URL shortener, message IDs | `url-shortener` |
| fanout | One write, many readers | Feeds, notifications, chat | `social-feed` |
| hot-key | Skewed access | Celebrity user, flash sale | `proximity-matching`, `search-and-autocomplete`, and four others |
| exactly-once-effect | Duplicates must not double-apply | Payments, ticketing | `ticket-booking`, `job-scheduler`, `real-time-attribution` |
| geo-index | Spatial queries at scale | Ride-hailing, delivery | `proximity-matching` |
| large-object | Bytes too big for a database row | Video, file sync, images | `file-sync` |
| time-series-ingest | High-volume append plus rollup | Metrics, logging, analytics | `metrics-platform` |
| search-index | Inverted index plus freshness | Search, autocomplete | `search-and-autocomplete` |
| scheduling | Do this later, once, at scale | Job queue, reminders, cron | `job-scheduler` |
| inventory-contention | Limited units, concurrent buyers | Ticket, hotel, flight booking | `ticket-booking` |
| stream-join | Correlate events across sources | Ads, recommendations, fraud | `real-time-attribution` |

Every signature has at least one worked example. That is the condition under which indexing by
signature is useful rather than aspirational: a learner who identifies the primitive can always
follow it to a derivation.

The library is **indexed by signature**, so a learner facing an unfamiliar prompt can find the
primitives instead of hunting for a lookalike company.

## Honesty requirements

- Standing banner: pedagogical approximation, not a company's architecture.
- Every company-specific claim labelled and cited, or removed.
- Numbers are assumptions the learner can change and re-derive.
