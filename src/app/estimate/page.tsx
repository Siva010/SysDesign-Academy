import type { Metadata } from 'next';
import Link from 'next/link';
import { Estimator } from '@/components/mdx/Estimator';
import { ESTIMATORS } from '@/content/estimators';

export const metadata: Metadata = {
  title: 'Estimation toolkit',
  description:
    'Back-of-the-envelope estimation with every assumption visible and adjustable.',
};

export default function EstimatePage() {
  return (
    <div className="content-wide">
      <p className="eyebrow">Library</p>
      <h1 className="page-title">Estimation toolkit</h1>
      <p className="page-lede">
        Estimation is not arithmetic and it is not memorised latency tables. It is the practice
        of making your assumptions explicit, deriving the consequence, and asking one question:{' '}
        <strong>would a ten-fold change here alter the architecture?</strong> If not, stop
        estimating and design.
      </p>

      <div className="callout callout-info">
        <div className="callout-title">How to use these</div>
        <p>
          Every input is an assumption you can defend or change. The derived rows recompute
          immediately, and the highlighted ones are the numbers that decide the design. Move a
          slider by an order of magnitude and watch which conclusions survive.
        </p>
        <p style={{ marginBottom: 0 }}>
          In an interview, say your assumptions out loud before you compute anything. An
          interviewer cannot evaluate a number, but they can evaluate the reasoning that produced
          it — and they will correct an assumption they disagree with, which is exactly what you
          want.
        </p>
      </div>

      <section>
        <h2 className="section-title">The four estimates that matter most</h2>
        <p className="muted small" style={{ maxWidth: '44rem' }}>
          Almost every design conversation needs some combination of these: how much traffic,
          how much data, how available, and how much of the load a cache actually absorbs.
        </p>
      </section>

      <div className="stack" style={{ gap: '3rem', marginTop: '1.5rem' }}>
        {ESTIMATORS.map((e) => (
          <section key={e.id} id={e.id}>
            <Estimator preset={e.id} />
          </section>
        ))}
      </div>

      <section>
        <h2 className="section-title">Numbers worth carrying in your head</h2>
        <p className="muted small" style={{ maxWidth: '44rem' }}>
          Not benchmarks. These are orders of magnitude and unit conversions, useful because they
          let you sanity-check a result without a calculator. Anything more precise than this is
          a measurement you should take, not a number you should memorise.
        </p>
        <div className="table-scroll" style={{ marginTop: '1rem' }}>
          <table className="block-table">
            <thead>
              <tr>
                <th>Quantity</th>
                <th>Rough value</th>
                <th>Why it is useful</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Seconds in a day</td>
                <td className="mono">86,400 ≈ 10⁵</td>
                <td>Converts anything per-day into anything per-second in one step.</td>
              </tr>
              <tr>
                <td>Seconds in a month</td>
                <td className="mono">≈ 2.6 × 10⁶</td>
                <td>Turns a monthly bill into a per-second cost.</td>
              </tr>
              <tr>
                <td>Minutes in a year</td>
                <td className="mono">≈ 526,000</td>
                <td>
                  Converts an availability target into downtime. 99.9% is about 526 minutes a
                  year.
                </td>
              </tr>
              <tr>
                <td>Speed of light in fibre</td>
                <td className="mono">≈ 200,000 km/s</td>
                <td>
                  The physical floor on latency. Roughly 1 ms per 100 km one way, so 10 ms per
                  1,000 km round trip.
                </td>
              </tr>
              <tr>
                <td>1 million writes/day</td>
                <td className="mono">≈ 12 per second</td>
                <td>
                  Calibrates intuition: numbers that sound enormous per day are often trivial per
                  second.
                </td>
              </tr>
              <tr>
                <td>1 KB per record, 1 billion records</td>
                <td className="mono">≈ 1 TB</td>
                <td>
                  The quickest way to check whether the dataset fits on one machine.
                </td>
              </tr>
              <tr>
                <td>Order of magnitude gaps</td>
                <td className="mono">memory ≪ SSD ≪ network ≪ disk seek</td>
                <td>
                  You rarely need the exact figures. You need to know which is roughly a thousand
                  times slower than which.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: '1rem' }}>
          Deliberately absent: a table of precise device latencies. Those numbers change with
          hardware generations, and quoting a stale figure with confidence is worse than saying
          &ldquo;memory is roughly three orders of magnitude faster than a network round
          trip&rdquo; and moving on. See <Link href="/sources">how claims are sourced</Link>.
        </p>
      </section>
    </div>
  );
}
