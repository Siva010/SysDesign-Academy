# Source Map & Evidence Rules

> Registry: `src/content/sources.ts`. Every citation in content references a source id.

## Tiers (from the resource library, §10)

| Tier | Kind | Establishes |
|---|---|---|
| 1 | RFCs, official docs, original papers, official engineering publications | Fact |
| 2 | DDIA, MIT 6.5840, OSTEP, standard textbooks | Conceptual truth |
| 3 | Company engineering blogs | Production reality *at that company, at that time* |
| 4 | Interview-prep sites | Interview convention, not technical fact |

**The hierarchy is never inverted.** A tier-4 source may not be the sole support for a claim
about protocol behaviour, database guarantees, or consistency semantics.

## Claim labels

Every non-obvious claim in the content carries one of six labels, rendered as a visible chip:

| Label | Meaning | Requires |
|---|---|---|
| `fact` | Documented and verifiable | Tier 1–2 citation |
| `convention` | What the industry commonly does | Two independent sources, or one tier-3 |
| `recommendation` | Our engineering opinion | Stated reasoning; must name conditions |
| `simplification` | True enough at this level, refined later | Link to the deeper treatment |
| `inference` | Derived, not stated by the source | Stated derivation |
| `speculation` | Plausible, unverified | Only permitted for *pedagogical* architectures, never for company claims |

This is enforced: `<Claim>` is a component, `label` is required, and `fact` without a
`source` fails content validation.

## Company architecture rule

Case studies are **pedagogical approximations**. Every case study renders a standing notice:

> This is a pedagogical approximation, not a claim about the company's proprietary
> architecture.

Where a company has publicly documented something, it is cited and marked `fact`, and the
distinction between *publicly known* / *reasonable design* / *speculation* is made inline
rather than in a footnote.

## Numbers rule

No invented benchmarks. Numbers in the content are one of:

- **Cited measurement** — with source and date.
- **Physical constant** — speed of light in fibre, disk seek order-of-magnitude.
- **Stated assumption** — "assume 1 KB per row"; always visible and always adjustable in the
  estimation tools.

Order-of-magnitude latency figures use a dated, cited table (`src/content/latency-numbers.ts`)
with an explicit note that these are *orders of magnitude for reasoning*, not benchmarks.

## Handling disagreement

When sources conflict, content does not silently pick one. It uses the `<Disagreement>`
component: what each source says, why they differ (version? workload? definition?), and what
the learner should take away.
