/**
 * The interview simulator (brief section 19).
 *
 * Honest framing, stated on the page itself: this is a *scripted* interviewer with branching,
 * not a language model. It cannot understand free-form answers. What it can do — and what
 * matters for practice — is present realistic underspecified prompts, react differently
 * depending on the quality of your choice, escalate when you are doing well, probe basics
 * when you are not, and produce a report that tells you which dimension you were weak on.
 *
 * The scoring dimensions are the ones interviewers actually assess.
 */

export type Dimension =
  | 'requirements'
  | 'estimation'
  | 'architecture'
  | 'data-modelling'
  | 'scalability'
  | 'reliability'
  | 'consistency'
  | 'failure-handling'
  | 'trade-offs'
  | 'communication'
  | 'adaptability';

export const DIMENSION_LABEL: Record<Dimension, string> = {
  requirements: 'Requirements gathering',
  estimation: 'Estimation',
  architecture: 'Architecture',
  'data-modelling': 'Data modelling',
  scalability: 'Scalability',
  reliability: 'Reliability',
  consistency: 'Consistency reasoning',
  'failure-handling': 'Failure handling',
  'trade-offs': 'Trade-off quality',
  communication: 'Communication',
  adaptability: 'Adaptability',
};

export type PhaseKind =
  | 'clarify'
  | 'estimate'
  | 'design'
  | 'deepen'
  | 'pressure'
  | 'failure'
  | 'tradeoff'
  | 'wrap';

export interface Choice {
  id: string;
  /** What you say. Written as a candidate would actually say it, not as a summary. */
  text: string;
  quality: 'strong' | 'adequate' | 'weak';
  /** Dimension deltas, -2 to +2. */
  scores: Partial<Record<Dimension, number>>;
  /** How the interviewer responds. This is where the teaching happens. */
  reaction: string;
  /** Shown in the report: what a stronger candidate would have said here. */
  coaching: string;
  /** Concepts this answer exercises, for progress tracking. */
  concepts?: string[];
  /** Override the next phase. Otherwise the phase's own routing applies. */
  next?: string;
}

export interface Phase {
  id: string;
  kind: PhaseKind;
  /** What the interviewer says. */
  prompt: string;
  /** Optional scene-setting shown as a note rather than speech. */
  note?: string;
  choices: Choice[];
  /** Default next phase. */
  next?: string;
  /** Taken when the running signal is strong: escalate. */
  nextIfStrong?: string;
  /** Taken when the running signal is weak: go back to fundamentals. */
  nextIfWeak?: string;
}

export interface Scenario {
  id: string;
  title: string;
  /** The interviewer's opening line, deliberately underspecified. */
  opening: string;
  difficulty: 'intro' | 'core' | 'advanced' | 'staff';
  minutes: number;
  /** Which case study covers the same ground, for follow-up study. */
  caseStudyId?: string;
  /** Dimensions this scenario actually exercises; the report only shows these. */
  assesses: Dimension[];
  startPhase: string;
  phases: Phase[];
}
