import type { DecisionCandidate } from "../generated/types";
import { assertValidConfig } from "./config";
import { excludedBy, shiftContext, type ShiftContext } from "./filters";
import { type AssignmentProblem, solveAssignment } from "./flow";
import { poolStats, scoreCandidate } from "./score";
import {
  ALGORITHM_VERSION,
  type Candidate,
  type MatchingInput,
  type MatchingResult,
  type ShiftResult,
  type Urgency,
} from "./types";

// The whole engine: hard filters, score, global assignment (decisions/0008).
//
//   1. Check the configuration and sort the input, so the order the caller
//      used never matters.
//   2. For every shift and every candidate: the first hard filter that
//      excludes them, or a score with components.
//   3. Turn the scored pairs into an assignment problem and solve it with
//      min-cost max-flow. Each candidate gets at most one shift.
//   4. Report every candidate per shift in the shape stored in decisions.

/** Scores are 0 to 100 with two decimals, so costs in hundredths are whole numbers. */
const SCORE_SCALE = 100;
const MAX_COST = 100 * SCORE_SCALE;

/**
 * Subtracted from the cost of urgent and critical shifts. They are larger
 * than any score difference, so these shifts always choose first when there
 * are too few candidates (decisions/0008).
 */
const PRIORITY_BONUS: Record<Urgency, number> = {
  calm: 0,
  normal: 0,
  urgent: MAX_COST + 1,
  critical: 2 * (MAX_COST + 1),
};

interface Evaluation {
  candidate: Candidate;
  excludedBy: DecisionCandidate["excludedBy"];
  score: number | null;
  components: DecisionCandidate["components"];
}

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function match(input: MatchingInput): MatchingResult {
  assertValidConfig(input.config);

  // 1. Sort. The fairness order decides ties: fewer recent assignments first, then ID.
  const shifts = [...input.shifts].sort(byId);
  const candidates = [...input.candidates].sort(
    (a, b) =>
      (a.stats?.assignmentsLast30Days ?? 0) - (b.stats?.assignmentsLast30Days ?? 0) || byId(a, b),
  );
  const sortedInput: MatchingInput = { ...input, shifts, candidates };
  const pool = poolStats(candidates);

  // 2. Filter and score every pair.
  const contexts = shifts.map((toFill) => shiftContext(toFill, sortedInput));
  const evaluations = contexts.map((context) =>
    candidates.map((candidate) => evaluate(candidate, context, sortedInput, pool)),
  );

  // 3. Build and solve the assignment problem.
  const slots = contexts.map((context, j) => slotsFor(context, evaluations[j]!, sortedInput));
  const problem: AssignmentProblem = {
    candidateCount: candidates.length,
    shiftSlots: slots,
    edges: evaluations.flatMap((row, j) =>
      row.flatMap((evaluation, i) =>
        evaluation.score === null
          ? []
          : [{ candidate: i, shift: j, cost: costOf(evaluation.score, contexts[j]!.urgency, i, candidates.length) }],
      ),
    ),
  };
  const selected = new Set(solveAssignment(problem).map((pair) => `${pair.candidate}:${pair.shift}`));

  // 4. Report.
  return {
    algorithmVersion: ALGORITHM_VERSION,
    configVersion: input.config.version,
    shifts: contexts.map((context, j) => report(context, evaluations[j]!, slots[j]!, j, selected)),
  };
}

function evaluate(
  candidate: Candidate,
  context: ShiftContext,
  input: MatchingInput,
  pool: ReturnType<typeof poolStats>,
): Evaluation {
  const filter = excludedBy(candidate, context, input);
  if (filter !== null) {
    return { candidate, excludedBy: filter, score: null, components: null };
  }
  const { score, components } = scoreCandidate(candidate, context, input, pool);
  return { candidate, excludedBy: null, score, components };
}

/** The wave size from the wave table. Null means every qualified candidate. */
function slotsFor(context: ShiftContext, row: Evaluation[], input: MatchingInput): number {
  const rule = input.config.waves[context.urgency];
  const eligible = row.filter((evaluation) => evaluation.score !== null).length;
  return rule.waveSize ?? eligible;
}

/**
 * Integer cost of giving a candidate a shift: lower is better.
 * (100 - score) in hundredths, minus the urgency bonus, then multiplied up
 * so the candidate's place in the fairness order can be added as a tie
 * breaker. The multiplier is larger than any possible sum of ranks, so the
 * tie breaker never outweighs even 0.01 of real score difference.
 */
function costOf(score: number, urgency: Urgency, fairnessRank: number, candidateCount: number): number {
  const base = Math.round((100 - score) * SCORE_SCALE) - PRIORITY_BONUS[urgency];
  return base * (candidateCount * candidateCount + 1) + fairnessRank;
}

function report(
  context: ShiftContext,
  row: Evaluation[],
  slots: number,
  shiftIndex: number,
  selected: Set<string>,
): ShiftResult {
  const candidates: DecisionCandidate[] = row.map((evaluation, i) => ({
    substituteId: evaluation.candidate.id,
    excludedBy: evaluation.excludedBy,
    score: evaluation.score,
    components: evaluation.components,
    selected: selected.has(`${i}:${shiftIndex}`),
  }));

  // Best first: scored by score, then excluded. Ties by ID.
  candidates.sort(
    (a, b) =>
      (b.score ?? -1) - (a.score ?? -1) ||
      (a.substituteId < b.substituteId ? -1 : a.substituteId > b.substituteId ? 1 : 0),
  );

  return {
    shiftId: context.toFill.id,
    wave: context.toFill.wave,
    urgency: context.urgency,
    slots,
    candidates,
    selectedSubstituteIds: candidates.filter((c) => c.selected).map((c) => c.substituteId),
  };
}

/**
 * A stable text version of the input, for the input hash in decisions
 * (rule 8). Keys are sorted at every level and shifts and candidates are
 * sorted by ID, so the same input always gives the same text. The hash
 * itself is computed outside the engine (step 4), because node:crypto is
 * not allowed in matching/.
 */
export function canonicalInput(input: MatchingInput): string {
  const sorted: MatchingInput = {
    ...input,
    shifts: [...input.shifts].sort(byId),
    candidates: [...input.candidates].sort(byId),
  };
  return JSON.stringify(sortKeys(sorted));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}
