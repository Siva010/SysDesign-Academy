import type { Metadata } from 'next';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { LEVELS } from '@/content/curriculum';
import { LEVEL_CONCEPTS } from '@/content/level-concepts';

export const metadata: Metadata = {
  title: 'Your progress',
  description: 'How mastery is measured here, and where you currently stand.',
};

export default function ProgressPage() {
  const levels = LEVELS.map((l) => ({
    index: l.index,
    name: l.name,
    concepts: LEVEL_CONCEPTS[l.index] ?? [],
  }));

  return (
    <div className="content-wide">
      <p className="eyebrow">About</p>
      <h1 className="page-title">Your progress</h1>
      <p className="page-lede">
        Clicking &ldquo;complete&rdquo; is not evidence of anything. Mastery here is inferred
        from what you have actually done, it decays if you never use it, and it is stored only in
        this browser.
      </p>

      <ProgressDashboard levels={levels} />
    </div>
  );
}
