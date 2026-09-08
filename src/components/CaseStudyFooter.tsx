'use client';

import { PassControl } from './PassControl';

/**
 * The end of a case study.
 *
 * Case studies rotate like lessons, and they benefit from it more: a pressure round you have
 * already seen the answer to is a different exercise the second time, and the useful version is
 * to answer it before reading on. The preface says so, because the honest failure mode here is
 * reading the derivation and feeling like you produced it.
 */
export function CaseStudyFooter({ id }: { id: string }) {
  return (
    <>
      <p className="small muted" style={{ marginTop: '3rem', marginBottom: 0 }}>
        The value of a case study is in deriving it, not in reading it. If you read the pressure
        rounds without pausing to answer them first, the honest thing is to leave this unmarked and
        come back to it.
      </p>
      <PassControl
        kind="case-study"
        id={id}
        nextHref="/interview/"
        nextLabel="Try it under interview pressure"
      />
    </>
  );
}
