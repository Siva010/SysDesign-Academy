import type { Metadata } from 'next';
import Link from 'next/link';
import { DECISIONS } from '@/content/decisions';

export const metadata: Metadata = {
  title: 'Decision tables',
  description:
    'Architecture comparisons expressed as constraint, consequence, choice — not as pros and cons.',
};

export default function DecisionsPage() {
  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Decision tables</h1>
      <p className="page-lede">
        You cannot choose an architecture by counting bullet points, which is what a pros-and-cons
        list invites you to do. Every table here is built the other way round: state the
        constraint you are actually under, follow the consequence, and the choice falls out.
        Each one also names the bad reasoning it exists to kill.
      </p>

      <div className="list-rows">
        {DECISIONS.map((d) => (
          <Link key={d.id} href={`/decisions/${d.id}`} className="list-row">
            <div className="list-row-head">
              <span className="list-row-title">{d.title}</span>
              <span className="tiny faint">{d.options.length} options</span>
            </div>
            <div className="list-row-summary">{d.question}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
