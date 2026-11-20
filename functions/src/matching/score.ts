import type {
  ScoreComponents,
  Shift,
  Subject,
  Substitute,
  SubstituteStats,
} from "../generated/types";
import type { ShiftContext } from "./filters";
import { minutesOfDay, toLocal } from "./local_time";
import type { Candidate, MatchingInput } from "./types";

// The score function (plan 7.3 and appendix B). Every component is 0 to 1.

export interface PoolStats {
  /** Sum of maxDaysPerWeek over all candidates. */
  desiredDaysTotal: number;
  /** Sum of assignmentsLast30Days over all candidates (0 without stats). */
  assignmentsLast30DaysTotal: number;
}

export interface ScoreResult {
  /** 0 to 100, two decimals. */
  score: number;
  components: ScoreComponents;
}

const RELATED_SUBJECTS: readonly (readonly Subject[])[] = [
  ["matematikk", "naturfag"],
  ["norsk", "engelsk", "fremmedsprak"],
  ["samfunnsfag", "krle"],
  ["kunst_og_handverk", "musikk", "mat_og_helse"],
];
const HALF_LIFE_DAYS = 120;
const FAMILIARITY_SATURATION = 4;
const PRIOR = 0.5;
const PRIOR_WEIGHT = 5;
const FAIRNESS_SCALE = 5;
const DEFAULT_TRAVEL_MINUTES = 20;
const MAX_TRAVEL_MINUTES = 45;
const EXPLORATION_OFFERS = 10;
const EXPLORATION_BONUS = 0.05;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Whole days from one local date (YYYY-MM-DD) to another. */
function daysBetween(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
}

/**
 * No subject on the shift: 0.5. Same subject on the grade: 1.0.
 * Same subject, other grades: 0.6. Related subject (same group in
 * RELATED_SUBJECTS): 0.4. Otherwise 0.1.
 */
export function subjectMatch(substitute: Substitute, shift: Shift): number {
  throw new Error("TODO");
}

/**
 * 0 without stats or without a class. Find the visits for the same school
 * and class. Each visit before shiftDate weighs 0.5 ** (days ago / 120).
 * Result: 1 - Math.exp(-sum / 4).
 */
export function classFamiliarity(
  stats: SubstituteStats | null,
  shift: Shift,
  shiftDate: string,
): number {
  throw new Error("TODO");
}

/**
 * 0.5 without stats. Overall: (accepted + 5 * 0.5) / (offers + 5).
 * The weekday is pulled towards the overall rate:
 * (accepted that day + 5 * overall) / (offered that day + 5).
 * The arrays start on Monday, so use index weekday - 1.
 */
export function acceptLikelihood(stats: SubstituteStats | null, weekday: number): number {
  throw new Error("TODO");
}

/**
 * 0.6 * attendanceRate + 0.2 * (1 - lateCancellationRate) + 0.2 * (schoolRating / 5).
 * Every missing part (no stats, or the field is null) counts as 0.5.
 */
export function reliability(stats: SubstituteStats | null): number {
  throw new Error("TODO");
}

/**
 * expected = maxDaysPerWeek / desiredDaysTotal
 * actual = assignmentsLast30Days / assignmentsLast30DaysTotal
 * Result: clamp01(0.5 + (expected - actual) * 5). Never divide by 0: Math.max(1, ...).
 */
export function fairness(
  substitute: Substitute,
  stats: SubstituteStats | null,
  pool: PoolStats,
): number {
  throw new Error("TODO");
}

/**
 * Average of three:
 * weekday in weekdays ? 1 : 0.3
 * local start >= earliestStart and local end <= latestEnd ? 1 : 0.2
 * grade in preferredGrades ? 1 : 0.5
 * An empty list means no preference and gives 1. A shift without grade gives 1.
 */
export function preferenceMatch(substitute: Substitute, shift: Shift, timeZone: string): number {
  throw new Error("TODO");
}

/** clamp01(1 - travelMinutes / 45). */
export function proximity(travelMinutes: number = DEFAULT_TRAVEL_MINUTES): number {
  throw new Error("TODO");
}

/** Fewer than 10 offers: 0.05 * (1 - offers / 10). Otherwise 0. No stats means 0 offers. */
export function explorationBonus(stats: SubstituteStats | null): number {
  throw new Error("TODO");
}

/** Sums over all candidates, see PoolStats. */
export function poolStats(candidates: readonly Candidate[]): PoolStats {
  throw new Error("TODO");
}

/**
 * Builds all components, then: weighted sum + explorationBonus, clamp01,
 * times 100, rounded to two decimals: Math.round(x * 10_000) / 100.
 * Weights are in input.config.weights, the weekday from toLocal(shift.startsAt, ...).
 */
export function scoreCandidate(
  candidate: Candidate,
  context: ShiftContext,
  input: MatchingInput,
  pool: PoolStats,
): ScoreResult {
  throw new Error("TODO");
}
