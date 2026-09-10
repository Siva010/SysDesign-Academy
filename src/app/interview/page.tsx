import type { Metadata } from 'next';
import { InterviewSimulator } from '@/components/InterviewSimulator';

export const metadata: Metadata = {
  title: 'Interview simulator',
  description:
    'A branching interviewer that escalates when you do well, probes fundamentals when you do not, and gives you a scored debrief.',
};

export default function InterviewPage() {
  return (
    <div className="content-wide is-tool">
      <p className="eyebrow">Practice</p>
      <h1 className="page-title">Interview simulator</h1>
      <p className="page-lede">
        The interviewer here does what a real one does: gives you an underspecified prompt,
        reacts to the quality of your answer, escalates when you are handling it, and drops back
        to fundamentals when you are not. Afterwards it tells you which dimension let you down.
      </p>

      <InterviewSimulator />
    </div>
  );
}
