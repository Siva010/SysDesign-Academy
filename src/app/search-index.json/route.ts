import { NextResponse } from 'next/server';
import { CONCEPTS } from '@/content/concepts';
import { DECISIONS } from '@/content/decisions';
import { CONCEPT_LEVEL } from '@/content/level-concepts';
import {
  loadAllCaseStudies,
  loadAllFailures,
  loadAllLessons,
  loadAllPatterns,
} from '@/lib/content-node';
import { plainText, type SearchDoc, type SearchIndexPayload } from '@/lib/search';

/**
 * The search index, built once at build time and fetched by the client on first use.
 *
 * It is a route rather than a script-generated file so that it stays correct in dev
 * without a separate watch process, and so the content loader remains the single
 * source of truth.
 */
export const dynamic = 'force-static';

export function GET() {
  const docs: SearchDoc[] = [];

  for (const c of CONCEPTS) {
    docs.push({
      id: `concept:${c.id}`,
      kind: 'concept',
      title: c.name,
      summary: c.oneLiner,
      text: [c.oneLiner, ...(c.aliases ?? []), c.myth ?? '', c.mythCorrection ?? ''].join(' '),
      concepts: [c.id, ...(c.requires ?? []), ...(c.leadsTo ?? [])],
      url: `/concepts/${c.id}`,
      level: CONCEPT_LEVEL[c.id],
    });
  }

  for (const l of loadAllLessons()) {
    docs.push({
      id: `lesson:${l.id}`,
      kind: 'lesson',
      title: l.title,
      summary: l.summary,
      text: plainText(l.body),
      concepts: [...l.concepts, ...l.unlocks],
      url: `/lessons/${l.id}`,
      level: l.level,
    });
  }

  for (const p of loadAllPatterns()) {
    docs.push({
      id: `pattern:${p.id}`,
      kind: 'pattern',
      title: p.title,
      summary: p.problem,
      text: plainText(p.body),
      concepts: p.concepts,
      url: `/patterns/${p.id}`,
    });
  }

  for (const c of loadAllCaseStudies()) {
    docs.push({
      id: `case-study:${c.id}`,
      kind: 'case-study',
      title: c.title,
      summary: c.ask,
      text: plainText(c.body),
      concepts: c.concepts,
      url: `/case-studies/${c.id}`,
    });
  }

  for (const f of loadAllFailures()) {
    docs.push({
      id: `failure:${f.id}`,
      kind: 'failure',
      title: f.title,
      summary: f.symptom,
      text: plainText(f.body),
      concepts: f.concepts,
      url: `/failures/${f.id}`,
    });
  }

  for (const d of DECISIONS) {
    docs.push({
      id: `decision:${d.id}`,
      kind: 'decision',
      title: d.title,
      summary: d.question,
      text: [
        d.question,
        d.antiPattern ?? '',
        ...d.options.map((o) => `${o.name} ${o.oneLiner}`),
        ...d.rules.map((r) => `${r.constraint} ${r.consequence}`),
      ].join(' '),
      concepts: d.concepts,
      url: `/decisions/${d.id}`,
    });
  }

  const payload: SearchIndexPayload = {
    docs,
    conceptNames: Object.fromEntries(CONCEPTS.map((c) => [c.id, c.name])),
  };

  return NextResponse.json(payload);
}
