import type { PrimitiveSignature } from '@/lib/types';

/**
 * The primitive problems underneath the case studies (docs/06-case-study-taxonomy.md).
 *
 * Indexing by signature rather than by company is what makes an unfamiliar prompt tractable:
 * "design a food delivery service" and "design a ride-hailing service" are the same
 * geospatial-index problem wearing different nouns.
 */
export const SIGNATURE_LABEL: Record<PrimitiveSignature, string> = {
  'id-generation': 'Unique IDs without coordination',
  fanout: 'One write, many readers',
  'hot-key': 'Skewed access',
  'exactly-once-effect': 'Duplicates must not double-apply',
  'geo-index': 'Spatial queries at scale',
  'large-object': 'Bytes too big for a row',
  'time-series-ingest': 'High-volume append and rollup',
  'search-index': 'Inverted index and freshness',
  scheduling: 'Do this later, once, at scale',
  'inventory-contention': 'Limited units, concurrent buyers',
  'stream-join': 'Correlating events across sources',
};

export const SIGNATURE_ORDER: PrimitiveSignature[] = [
  'id-generation',
  'fanout',
  'hot-key',
  'exactly-once-effect',
  'inventory-contention',
  'large-object',
  'search-index',
  'geo-index',
  'time-series-ingest',
  'scheduling',
  'stream-join',
];
