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
  const subject = shift.subject;
  if (subject === null) {
    return 0.5;
  }

  const teaching = substitute.qualifications.teachingSubjects;
  const sameSubject = teaching.filter((t) => t.subject === subject);

  // A shift without a grade (rare) counts every grade as a match.
  if (sameSubject.some((t) => shift.grade === null || t.grades.includes(shift.grade))) {
    return 1;
  }
  if (sameSubject.length > 0) {
    return 0.6;
  }

  const group = RELATED_SUBJECTS.find((subjects) => subjects.includes(subject));
  if (group !== undefined && teaching.some((t) => group.includes(t.subject))) {
    return 0.4;
  }
  return 0.1;
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
  if (stats === null || shift.className === null) {
    return 0;
  }

  const visits = stats.classVisits.find(
    (v) => v.schoolId === shift.schoolId && v.className === shift.className,
  );
  if (visits === undefined) {
    return 0;
  }

  // YYYY-MM-DD strings sort like dates, so < means "before".
  let weighted = 0;
  for (const date of visits.dates) {
    if (date < shiftDate) {
      weighted += 0.5 ** (daysBetween(date, shiftDate) / HALF_LIFE_DAYS);
    }
  }
  return 1 - Math.exp(-weighted / FAMILIARITY_SATURATION);
}

/**
 * 0.5 without stats. Overall: (accepted + 5 * 0.5) / (offers + 5).
 * The weekday is pulled towards the overall rate:
 * (accepted that day + 5 * overall) / (offered that day + 5).
 * The arrays start on Monday, so use index weekday - 1.
 */
export function acceptLikelihood(stats: SubstituteStats | null, weekday: number): number {
  if (stats === null) {
    return PRIOR;
  }

  const overall =
    (stats.offersAccepted + PRIOR_WEIGHT * PRIOR) / (stats.offersTotal + PRIOR_WEIGHT);

  const offeredThatDay = stats.offeredByWeekday[weekday - 1] ?? 0;
  const acceptedThatDay = stats.acceptedByWeekday[weekday - 1] ?? 0;

  return clamp01((acceptedThatDay + PRIOR_WEIGHT * overall) / (offeredThatDay + PRIOR_WEIGHT));
}

/**
 * 0.6 * attendanceRate + 0.2 * (1 - lateCancellationRate) + 0.2 * (schoolRating / 5).
 * Every missing part (no stats, or the field is null) counts as 0.5.
 */
export function reliability(stats: SubstituteStats | null): number {
  const attendance = stats?.attendanceRate ?? PRIOR;
  const lateCancellations = stats?.lateCancellationRate ?? PRIOR;
  const rating = stats?.schoolRating == null ? PRIOR : stats.schoolRating / 5;

  return clamp01(0.6 * attendance + 0.2 * (1 - lateCancellations) + 0.2 * rating);
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
  const expected = substitute.preferences.maxDaysPerWeek / Math.max(1, pool.desiredDaysTotal);
  const actual = (stats?.assignmentsLast30Days ?? 0) / Math.max(1, pool.assignmentsLast30DaysTotal);

  return clamp01(0.5 + (expected - actual) * FAIRNESS_SCALE);
}

/**
 * Average of three:
 * weekday in weekdays ? 1 : 0.3
 * local start >= earliestStart and local end <= latestEnd ? 1 : 0.2
 * grade in preferredGrades ? 1 : 0.5
 * An empty list means no preference and gives 1. A shift without grade gives 1.
 */
export function preferenceMatch(substitute: Substitute, shift: Shift, timeZone: string): number {
  const preferences = substitute.preferences;
  const start = toLocal(shift.startsAt, timeZone);
  const end = toLocal(shift.endsAt, timeZone);

  const weekdayFits =
    preferences.weekdays.length === 0 || preferences.weekdays.includes(start.weekday);

  const timeFits =
    start.minutes >= minutesOfDay(preferences.earliestStart) &&
    end.minutes <= minutesOfDay(preferences.latestEnd);

  const gradeFits =
    preferences.preferredGrades.length === 0 ||
    shift.grade === null ||
    preferences.preferredGrades.includes(shift.grade);

  return ((weekdayFits ? 1 : 0.3) + (timeFits ? 1 : 0.2) + (gradeFits ? 1 : 0.5)) / 3;
}

/** clamp01(1 - travelMinutes / 45). */
export function proximity(travelMinutes: number = DEFAULT_TRAVEL_MINUTES): number {
  return clamp01(1 - travelMinutes / MAX_TRAVEL_MINUTES);
}

/** Fewer than 10 offers: 0.05 * (1 - offers / 10). Otherwise 0. No stats means 0 offers. */
export function explorationBonus(stats: SubstituteStats | null): number {
  const offers = stats?.offersTotal ?? 0;
  if (offers >= EXPLORATION_OFFERS) {
    return 0;
  }
  return EXPLORATION_BONUS * (1 - offers / EXPLORATION_OFFERS);
}

/** Sums over all candidates, see PoolStats. */
export function poolStats(candidates: readonly Candidate[]): PoolStats {
  let desiredDaysTotal = 0;
  let assignmentsLast30DaysTotal = 0;
  for (const candidate of candidates) {
    desiredDaysTotal += candidate.substitute.preferences.maxDaysPerWeek;
    assignmentsLast30DaysTotal += candidate.stats?.assignmentsLast30Days ?? 0;
  }
  return { desiredDaysTotal, assignmentsLast30DaysTotal };
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
  const { substitute, stats } = candidate;
  const shift = context.toFill.shift;
  const weekday = toLocal(shift.startsAt, input.timeZone).weekday;

  const components: ScoreComponents = {
    subjectMatch: subjectMatch(substitute, shift),
    classFamiliarity: classFamiliarity(stats, shift, context.date),
    acceptLikelihood: acceptLikelihood(stats, weekday),
    reliability: reliability(stats),
    fairness: fairness(substitute, stats, pool),
    preferenceMatch: preferenceMatch(substitute, shift, input.timeZone),
    proximity: proximity(),
  };

  const weights = input.config.weights;
  const weightedSum =
    weights.subjectMatch * components.subjectMatch +
    weights.classFamiliarity * components.classFamiliarity +
    weights.acceptLikelihood * components.acceptLikelihood +
    weights.reliability * components.reliability +
    weights.fairness * components.fairness +
    weights.preferenceMatch * components.preferenceMatch +
    weights.proximity * components.proximity;

  const total = clamp01(weightedSum + explorationBonus(stats));
  return { score: Math.round(total * 10_000) / 100, components };
}
