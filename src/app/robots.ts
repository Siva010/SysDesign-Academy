import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Everything here is public and worth indexing, so this exists mainly to point crawlers at the
 * sitemap rather than to keep them out.
 *
 * The one exclusion is the search index: it is a 300 KB JSON blob of every document's text,
 * fetched by the client to make search work offline. Indexed, it would be a duplicate of the
 * whole site in a form no reader wants to land on.
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/search-index.json' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
