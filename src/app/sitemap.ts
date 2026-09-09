import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { CONCEPTS } from '@/content/concepts';
import { LEVELS } from '@/content/curriculum';
import { DECISIONS } from '@/content/decisions';
import {
  loadAllCaseStudies,
  loadAllFailures,
  loadAllLessons,
  loadAllPatterns,
} from '@/lib/content-node';

/**
 * The sitemap, built from the same content the pages are.
 *
 * Four hundred pages with no sitemap are four hundred pages a crawler finds only by walking
 * links, and the deepest ones - a concept three hops from the index - are the ones it gives up
 * on. Generating it from the loaders rather than maintaining a list means it cannot fall behind
 * the content.
 *
 * `priority` here is a hint about relative importance within this site, not a ranking claim.
 * Lessons and case studies are the work; index pages exist to reach them; concept pages are
 * reference material that is genuinely useful to land on from a search.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path}`;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: url('/'), priority: 1, changeFrequency: 'weekly' },
    { url: url('/next/'), priority: 0.5, changeFrequency: 'monthly' },
    { url: url('/method/'), priority: 0.8, changeFrequency: 'monthly' },
    { url: url('/interview/'), priority: 0.7, changeFrequency: 'monthly' },
    { url: url('/progress/'), priority: 0.3, changeFrequency: 'monthly' },
    { url: url('/estimate/'), priority: 0.6, changeFrequency: 'monthly' },
    { url: url('/glossary/'), priority: 0.5, changeFrequency: 'monthly' },
    { url: url('/myths/'), priority: 0.5, changeFrequency: 'monthly' },
    { url: url('/sources/'), priority: 0.4, changeFrequency: 'monthly' },
    { url: url('/concepts/'), priority: 0.7, changeFrequency: 'monthly' },
    { url: url('/patterns/'), priority: 0.7, changeFrequency: 'monthly' },
    { url: url('/case-studies/'), priority: 0.8, changeFrequency: 'monthly' },
    { url: url('/failures/'), priority: 0.6, changeFrequency: 'monthly' },
    { url: url('/decisions/'), priority: 0.6, changeFrequency: 'monthly' },
  ];

  for (const level of LEVELS) {
    entries.push({ url: url(`/levels/${level.index}/`), priority: 0.8, changeFrequency: 'monthly' });
  }
  for (const lesson of loadAllLessons()) {
    entries.push({ url: url(`/lessons/${lesson.id}/`), priority: 0.9, changeFrequency: 'monthly' });
  }
  for (const study of loadAllCaseStudies()) {
    entries.push({ url: url(`/case-studies/${study.id}/`), priority: 0.9, changeFrequency: 'monthly' });
  }
  for (const pattern of loadAllPatterns()) {
    entries.push({ url: url(`/patterns/${pattern.id}/`), priority: 0.7, changeFrequency: 'monthly' });
  }
  for (const failure of loadAllFailures()) {
    entries.push({ url: url(`/failures/${failure.id}/`), priority: 0.6, changeFrequency: 'monthly' });
  }
  for (const decision of DECISIONS) {
    entries.push({ url: url(`/decisions/${decision.id}/`), priority: 0.6, changeFrequency: 'monthly' });
  }
  for (const concept of CONCEPTS) {
    entries.push({ url: url(`/concepts/${concept.id}/`), priority: 0.5, changeFrequency: 'monthly' });
  }

  return entries.map((entry) => ({ lastModified: now, ...entry }));
}
