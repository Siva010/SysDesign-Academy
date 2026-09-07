import type { Metadata } from 'next';
import { NextSteps, type Goal, type LessonLite } from '@/components/NextSteps';
import { MODULES } from '@/content/curriculum';
import { orderedLessons } from '@/lib/content-node';

export const metadata: Metadata = {
  title: 'What to learn next',
  description:
    'An adaptive next step based on what you have understood, what has decayed, and what you are preparing for.',
};

const MODULE_ORDER: Record<string, number> = Object.fromEntries(
  MODULES.map((m) => [m.id, m.order]),
);

/**
 * Goals reorder the curriculum; they never hide anything. Each one names the concepts that
 * a person with that goal is most often missing, which is what the recommender pathfinds to.
 */
const GOALS: Goal[] = [
  {
    id: 'interview-soon',
    label: 'An interview in the next few weeks',
    description:
      'Breadth over depth, with the trade-off vocabulary and estimation you will be asked for out loud.',
    targets: [
      'back-of-envelope',
      'requirement-clarification',
      'cap',
      'sharding',
      'cache-generic',
      'idempotency',
      'fanout-on-write',
      'slo',
    ],
  },
  {
    id: 'senior-role',
    label: 'Moving from mid-level to senior',
    description:
      'The failure reasoning and operational judgment that separates a working design from a production one.',
    targets: [
      'cascading-failure',
      'load-shedding',
      'circuit-breaker',
      'schema-migration',
      'observability',
      'blast-radius',
      'error-budget',
    ],
  },
  {
    id: 'fundamentals',
    label: 'I want the fundamentals properly',
    description:
      'The distributed-systems core: time, agreement, consistency, and what each guarantee actually costs.',
    targets: [
      'linearizability',
      'consensus',
      'quorum-intersection',
      'causal-consistency',
      'isolation-levels',
      'replication-lag',
      'effectively-once',
    ],
  },
  {
    id: 'building-now',
    label: 'I am designing something right now',
    description:
      'The decisions you are about to make: storage choice, caching, async work, and how to change it later.',
    targets: [
      'partition-key',
      'index',
      'cache-invalidation',
      'queue',
      'outbox',
      'expand-contract',
      'timeout',
    ],
  },
];

export default function NextPage() {
  const ordered = orderedLessons(MODULE_ORDER);
  const lessons: LessonLite[] = ordered.map((l, i) => ({
    id: l.id,
    title: l.title,
    summary: l.summary,
    level: l.level,
    minutes: l.minutes,
    concepts: l.concepts,
    prerequisites: l.prerequisites,
    sequence: i,
  }));

  return (
    <div className="content-wide">
      <p className="eyebrow">Practice</p>
      <h1 className="page-title">What to learn next</h1>
      <p className="page-lede">
        Every recommendation here states its reason. If the reason does not convince you, ignore
        it — a recommender that cannot explain itself is just a shuffled list of contents.
      </p>

      <NextSteps lessons={lessons} goals={GOALS} />
    </div>
  );
}
