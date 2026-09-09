/**
 * Where this site lives.
 *
 * Absolute URLs are needed in three places that a relative path cannot serve: Open Graph images
 * (a crawler fetching a preview has no page to resolve against), canonical links, and the
 * sitemap. Keeping the origin in one constant means a custom domain is a one-line change rather
 * than a search across the codebase.
 *
 * Overridable by environment so a preview deployment does not advertise the production origin
 * and invite search engines to index a duplicate.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://sysdesign-academy.ms-ivas010.workers.dev';

export const SITE_NAME = 'System Design Academy';

export const SITE_DESCRIPTION =
  'A production-grade system design curriculum: mental models, trade-offs, failure modes and interview judgment, built from primary sources.';
