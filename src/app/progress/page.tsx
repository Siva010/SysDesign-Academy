import type { Metadata } from 'next';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { LEVELS } from '@/content/curriculum';
import { lessonIndex, loadAllCaseStudies } from '@/lib/content-node';

export const metadata: Metadata = {
  title: 'Your progress',
  description: 'What you have read, how many times, and what is due to come back round.',
};

export default function ProgressPage() {
  const levels = LEVELS.map((l) => ({ index: l.index, name: l.name }));
  const caseStudies = loadAllCaseStudies().map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="content-wide">
      <p className="eyebrow">About</p>
      <h1 className="page-title">Your progress</h1>
      <p className="page-lede">
        This records one thing: what you have marked as read, and when. It does not score you, and
        it does not infer what you understand — it has no way to know that, and pretending
        otherwise was the previous version&rsquo;s mistake. What it does is bring things back round
        at expanding intervals, because a curriculum this dense is not finished by reaching the end
        of it once.
      </p>

      <ProgressDashboard levels={levels} index={lessonIndex()} caseStudies={caseStudies} />
    </div>
  );
}
