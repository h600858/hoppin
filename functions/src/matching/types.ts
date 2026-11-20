import type {
  DecisionCandidate,
  DocumentId,
  Instant,
  SchoolConfig,
  Shift,
  Substitute,
  SubstituteStats,
} from "../generated/types";

// Input and output of the matching engine. Instants are ISO strings, exactly
// as in the schemas, so test cases can be plain JSON in shared/fixtures.

export const ALGORITHM_VERSION = "flow-1";

/** The parts of a school's configuration the engine uses. */
export type MatchingConfig = Pick<SchoolConfig, "version" | "weights" | "filters" | "waves">;

export type Urgency = "calm" | "normal" | "urgent" | "critical";

export interface MatchingInput {
  /** The clock of this run. The engine never reads the real clock. */
  now: Instant;
  /** The school's time zone, for local dates, weekdays and times. */
  timeZone: string;
  config: MatchingConfig;
  shifts: ShiftToFill[];
  candidates: Candidate[];
}

export interface ShiftToFill {
  id: DocumentId;
  shift: Shift;
  /** Wave number of this run for the shift, starting at 1. */
  wave: number;
  /** Everyone who has had an offer on this shift, in any status. */
  alreadyAskedSubstituteIds: DocumentId[];
}

export interface Candidate {
  id: DocumentId;
  substitute: Substitute;
  /** Null for a new substitute without history. */
  stats: SubstituteStats | null;
  /** Confirmed assignments and periods the substitute marked unavailable. */
  busy: BusyPeriod[];
  /** Shifts the substitute has an unanswered offer for (queued or sent). */
  openOfferShiftIds: DocumentId[];
}

export interface BusyPeriod {
  kind: "assignment" | "unavailable";
  startsAt: Instant;
  endsAt: Instant;
}

export interface MatchingResult {
  algorithmVersion: string;
  configVersion: number;
  shifts: ShiftResult[];
}

export interface ShiftResult {
  shiftId: DocumentId;
  wave: number;
  urgency: Urgency;
  /** How many offers the shift gets in this wave. */
  slots: number;
  /** Every candidate, excluded or scored, in the shape stored in decisions. */
  candidates: DecisionCandidate[];
  selectedSubstituteIds: DocumentId[];
}
