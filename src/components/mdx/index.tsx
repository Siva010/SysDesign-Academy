import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { Arch } from './Arch';
import { Check, EstimateCheck, OpenCheck } from './Check';
import { BottleneckCheck, CompleteCheck, DebugCheck, TransferCheck } from './CheckTypes';
import { Estimator } from './Estimator';
import {
  C,
  Callout,
  Cite,
  Claim,
  Disagreement,
  Example,
  Formula,
  GoDeeper,
  InterviewLens,
  Mistakes,
  RealWorld,
  ScaleTable,
  TradeOff,
  WhatBreaks,
} from './blocks';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function headingText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(headingText).join('');
  if (
    children &&
    typeof children === 'object' &&
    'props' in children &&
    (children as { props?: { children?: React.ReactNode } }).props
  ) {
    return headingText((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return '';
}

/** An inline expandable deep dive. Layer 6 of the depth model. */
export function Deeper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details>
      <summary>{title}</summary>
      <div className="details-body">{children}</div>
    </details>
  );
}

/** Internal link that keeps prose style consistent and validates nothing at runtime. */
function A({ href = '', children, ...rest }: React.ComponentProps<'a'>) {
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
        {children}
      </a>
    );
  }
  return <Link href={href}>{children}</Link>;
}

export const mdxComponents: MDXComponents = {
  a: A,
  h2: ({ children, ...rest }) => {
    const id = slugify(headingText(children));
    return (
      <h2 id={id} {...rest}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...rest }) => {
    const id = slugify(headingText(children));
    return (
      <h3 id={id} {...rest}>
        {children}
      </h3>
    );
  },
  table: ({ children, ...rest }) => (
    <div className="table-scroll">
      <table {...rest}>{children}</table>
    </div>
  ),

  /* content components */
  Arch,
  BottleneckCheck,
  C,
  Callout,
  Check,
  Cite,
  CompleteCheck,
  DebugCheck,
  Claim,
  Deeper,
  Disagreement,
  EstimateCheck,
  Estimator,
  Example,
  Formula,
  GoDeeper,
  InterviewLens,
  Mistakes,
  OpenCheck,
  RealWorld,
  ScaleTable,
  TradeOff,
  TransferCheck,
  WhatBreaks,
};

/** Extract h2/h3 headings from raw MDX for the "on this page" rail. */
export function extractHeadings(body: string): { level: 2 | 3; text: string; id: string }[] {
  const out: { level: 2 | 3; text: string; id: string }[] = [];
  const lines = body.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const level = m[1]!.length === 2 ? 2 : 3;
    const text = m[2]!.replace(/[*_`]/g, '');
    out.push({ level: level as 2 | 3, text, id: slugify(text) });
  }
  return out;
}
