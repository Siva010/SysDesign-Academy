/**
 * The content model for the System Design Academy.
 *
 * Everything the site renders is derived from these entities. Nothing is a hardcoded page.
 * See docs/04-content-taxonomy.md for the rationale.
 */

/* ------------------------------------------------------------------ evidence */

export type SourceTier = 1 | 2 | 3 | 4;

export interface Source {
  id: string;
  title: string;
  author?: string;
  url?: string;
  /** 1 = RFC/paper/official docs, 2 = textbook/course, 3 = engineering blog, 4 = interview prep */
  tier: SourceTier;
  kind:
    | 'rfc'
    | 'paper'
    | 'official-docs'
    | 'book'
    | 'course'
    | 'engineering-blog'
    | 'talk'
    | 'interview-prep';
  /** Year of publication or last substantive revision, when known. */
  year?: number;
  /** What this source is trustworthy for. Keeps us from over-citing. */
  authoritativeFor: string[];
}

/**
 * Every non-obvious claim in the curriculum carries one of these labels.
 * A `fact` requires a tier 1-2 source. `speculation` may never be attached to a claim
 * about a named company's internal architecture.
 */
export type ClaimLabel =
  | 'fact'
  | 'convention'
  | 'recommendation'
  | 'simplification'
  | 'inference'
  | 'speculation';

/* ------------------------------------------------------------------ concepts */

export type ConceptCluster =
  | 'fundamentals'
  | 'network'
  | 'application'
  | 'scaling'
  | 'storage-engines'
  | 'transactions'
  | 'replication'
  | 'coordination'
  | 'consistency'
  | 'messaging'
  | 'reliability'
  | 'operations';

export interface Concept {
  id: string;
  name: string;
  /** Search aliases: what a learner might actually type. */
  aliases?: string[];
  /** The honest one-line version. Not a dictionary definition. */
  oneLiner: string;
  cluster: ConceptCluster;
  /** Hard prerequisites only: a correct explanation is impossible without these. */
  requires?: string[];
  /** What this concept makes possible, or forces you to confront next. */
  leadsTo?: string[];
  /** What this concept trades against. The edge that teaches judgment. */
  tensionWith?: string[];
  /** A common misconception, stated as the wrong belief. */
  myth?: string;
  /** Why the myth is wrong. */
  mythCorrection?: string;
}

/* ------------------------------------------------------------------ curriculum */

export type Difficulty = 'intro' | 'core' | 'advanced' | 'staff';

export interface Level {
  id: string;
  index: number;
  name: string;
  /** The force that dominates this level. */
  constraint: string;
  /** What the learner can do at the end. */
  outcome: string;
  /** How the level's final system breaks, motivating the next level. */
  breaksBecause: string;
  moduleIds: string[];
}

export interface Module {
  id: string;
  levelId: string;
  name: string;
  /** A module answers exactly one question. */
  question: string;
  order: number;
  /**
   * Some modules are indexes into a library rather than a sequence of lessons.
   * Level 7's worked systems, for example, are the case studies themselves.
   */
  library?: 'case-studies' | 'patterns' | 'failures';
}

export interface LessonMeta {
  id: string;
  title: string;
  level: number;
  module: string;
  order: number;
  summary: string;
  difficulty: Difficulty;
  minutes: number;
  prerequisites: string[];
  concepts: string[];
  unlocks: string[];
  patterns?: string[];
  failures?: string[];
  caseStudies?: string[];
  sources: string[];
  status: 'stub' | 'draft' | 'reviewed';
  /** Set when a lesson deliberately exceeds the prerequisite budget. */
  prereqOverride?: string;
}

export interface Lesson extends LessonMeta {
  slug: string;
  body: string;
  filePath: string;
}

/* ------------------------------------------------------------------ patterns */

export type PatternCategory =
  | 'caching'
  | 'data'
  | 'messaging'
  | 'resilience'
  | 'scaling'
  | 'deployment'
  | 'consistency';

export interface PatternMeta {
  id: string;
  title: string;
  /** One line: the problem it solves. */
  problem: string;
  category: PatternCategory;
  concepts: string[];
  relatedPatterns?: string[];
  alsoKnownAs?: string[];
  /** Systems where this pattern is publicly documented. */
  seenIn?: string[];
  sources: string[];
  status: 'stub' | 'draft' | 'reviewed';
}

export interface Pattern extends PatternMeta {
  slug: string;
  body: string;
  filePath: string;
}

/* ------------------------------------------------------------------ case studies */

/**
 * The primitive signatures from docs/06-case-study-taxonomy.md: the shapes a system problem
 * reduces to, of which every case study is an instance of at least one.
 *
 * A runtime array rather than a bare union, so the validator can assert that each one is
 * actually taught by a case study. A union alone vanishes at compile time and the coverage
 * claim becomes something a human has to re-check by hand.
 */
export const PRIMITIVE_SIGNATURES = [
  'id-generation',
  'fanout',
  'hot-key',
  'exactly-once-effect',
  'geo-index',
  'large-object',
  'time-series-ingest',
  'search-index',
  'scheduling',
  'inventory-contention',
  'stream-join',
] as const;

export type PrimitiveSignature = (typeof PRIMITIVE_SIGNATURES)[number];

export interface CaseStudyMeta {
  id: string;
  title: string;
  /** The interviewer's opening line, deliberately underspecified. */
  ask: string;
  difficulty: Difficulty;
  minutes: number;
  signatures: PrimitiveSignature[];
  concepts: string[];
  patterns: string[];
  prerequisites: string[];
  sources: string[];
  status: 'stub' | 'draft' | 'reviewed';
}

export interface CaseStudy extends CaseStudyMeta {
  slug: string;
  body: string;
  filePath: string;
}

/* ------------------------------------------------------------------ failures */

export type FailureCategory =
  | 'overload'
  | 'latency'
  | 'data'
  | 'coordination'
  | 'dependency'
  | 'deployment'
  | 'capacity';

export interface FailureMeta {
  id: string;
  title: string;
  /** What an operator actually observes first. */
  symptom: string;
  category: FailureCategory;
  concepts: string[];
  sources: string[];
  status: 'stub' | 'draft' | 'reviewed';
}

export interface Failure extends FailureMeta {
  slug: string;
  body: string;
  filePath: string;
}

/* ------------------------------------------------------------------ decisions */

export interface DecisionCriterion {
  criterion: string;
  /** Keyed by option id. */
  values: Record<string, string>;
  /** Which option this criterion favours, if any. */
  favours?: string;
}

export interface Decision {
  id: string;
  title: string;
  /** The question a learner is actually asking when they reach this table. */
  question: string;
  options: { id: string; name: string; oneLiner: string }[];
  criteria: DecisionCriterion[];
  /** constraint then consequence then choice. Not "pros and cons". */
  rules: { constraint: string; consequence: string; choose: string }[];
  /** The bad reasoning this table exists to kill. */
  antiPattern?: string;
  concepts: string[];
  sources: string[];
}

/* ------------------------------------------------------------------ assessment */

export type QuestionType =
  | 'predict'
  | 'bottleneck'
  | 'whatbreaks'
  | 'estimate'
  | 'tradeoff'
  | 'complete'
  | 'debug'
  | 'design'
  | 'transfer';

export interface ChoiceOption {
  id: string;
  text: string;
  /** Not "wrong" - what model of the world this answer implies. */
  implies: string;
  /** Mechanism-level explanation. */
  why: string;
  credit: 'full' | 'partial' | 'none';
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  concepts: string[];
  options?: ChoiceOption[];
  /** For estimate questions. */
  answer?: { value: number; unit: string; tolerance: number; derivation: string[] };
  /** For open questions: what a rubric looks for. */
  rubric?: { point: string; weight: number; hint: string }[];
  /** Always present: what a stronger candidate adds. */
  stronger: string;
}

/* ------------------------------------------------------------------ symptoms */

/** Powers conceptual search: "database gets slow" resolves to the concepts that matter. */
export interface Symptom {
  phrase: string;
  aliases: string[];
  concepts: string[];
  why: string;
}

/* ------------------------------------------------------------------ progress */

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export interface ConceptProgress {
  mastery: MasteryLevel;
  lastReinforced: number;
  attempts: number;
  correct: number;
}

export interface InterviewResult {
  scenarioId: string;
  at: number;
  scores: Record<string, number>;
  turns: number;
}

export interface ProgressState {
  version: 1;
  lessonsRead: Record<string, number>;
  concepts: Record<string, ConceptProgress>;
  caseStudiesCompleted: Record<string, number>;
  interviews: InterviewResult[];
  goal?: string;
}
