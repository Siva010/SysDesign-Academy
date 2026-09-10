import type { Scenario } from './types';
import { DISPATCH } from './dispatch';
import { FEED } from './feed';
import { METRICS } from './metrics';
import { PAYMENTS } from './payments';
import { URL_SHORTENER } from './url-shortener';

export const SCENARIOS: Scenario[] = [URL_SHORTENER, FEED, PAYMENTS, DISPATCH, METRICS];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);

export * from './types';
