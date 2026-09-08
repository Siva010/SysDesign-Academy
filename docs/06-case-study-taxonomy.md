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
| id-generation | Unique IDs at scale without coordination | URL shortener, invoice numbers | `url-shortener`, `invoice-numbering` |
| fanout | One write, many readers | Feeds, notifications, alerts | `social-feed`, `geofence-alerting`, `url-shortener` |
| hot-key | Skewed access | Celebrity user, flash sale | `proximity-matching`, `ticket-booking`, and five others |
| exactly-once-effect | Duplicates must not double-apply | Payments, ticketing, numbering | `ticket-booking`, `job-scheduler`, `real-time-attribution`, `invoice-numbering` |
| geo-index | Spatial queries at scale | Ride-hailing, geofencing | `proximity-matching`, `geofence-alerting` |
| large-object | Bytes too big for a database row | Video, file sync, images | `file-sync`, `social-feed` |
| time-series-ingest | High-volume append plus rollup | Metrics, logging | `metrics-platform`, `log-search` |
| search-index | Inverted index plus freshness | Product search, log search | `search-and-autocomplete`, `log-search` |
| scheduling | Work that must run later, or somewhere | Job queue, build fleet | `job-scheduler`, `build-scheduler` |
| inventory-contention | Limited units, concurrent buyers | Ticketing, retail stock | `ticket-booking`, `distributed-inventory` |
| stream-join | Correlate events across sources | Attribution, fraud | `real-time-attribution`, `fraud-decisioning` |

Every signature has **at least two** worked examples, and that number is the point rather than a
milestone. One example teaches the instance: a learner who has only seen ticket booking knows how
ticket booking works. Two examples that disagree teach the pattern, because the difference between
them is where the reasoning lives.

So the second study for a signature is chosen to invert the first rather than to restate it:

| Signature | The pair, and what separates them |
|---|---|
| id-generation | The shortener wants opaque ids minted anywhere; invoice numbering wants a gapless sequence, which is a serialisation point by definition. |
| geo-index | Proximity matching answers ad-hoc nearest-neighbour queries over moving points; geofencing has queries registered in advance, so the index goes over the queries. |
| search-index | A catalogue index is written once and read a thousand times; a log index is the reverse by five orders of magnitude. |
| inventory-contention | A seat is named and overselling is unrecoverable; a unit of stock is fungible, overselling is recoverable, and the count is a belief about a physical world. |
| scheduling | The job scheduler asks whether work is due; the build scheduler asks what should run next under scarcity, which is a policy rather than an answer. |
| stream-join | Attribution can take minutes and be reconciled afterwards; a fraud decision must land inside the authorisation and can never be recalled. |

Run `npm run coverage` for the current counts. The validator errors when a signature has no case
study and warns when it has only one, so this table describes an invariant rather than a snapshot.

The library is **indexed by signature**, so a learner facing an unfamiliar prompt can find the
primitives instead of hunting for a lookalike company.

## Honesty requirements

- Standing banner: pedagogical approximation, not a company's architecture.
- Every company-specific claim labelled and cited, or removed.
- Numbers are assumptions the learner can change and re-derive.
