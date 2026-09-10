import type { Scenario } from './types';
import { DISPATCH } from './dispatch';
import { FEED } from './feed';
import { LOG_SEARCH } from './log-search';
import { METRICS } from './metrics';
import { PAYMENTS } from './payments';
import { TICKET_BOOKING } from './ticket-booking';
import { URL_SHORTENER } from './url-shortener';

export const SCENARIOS: Scenario[] = [
  URL_SHORTENER,
  FEED,
  PAYMENTS,
  TICKET_BOOKING,
  DISPATCH,
  METRICS,
  LOG_SEARCH,
];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);

export * from './types';
