// The public face of the matching engine. Code outside matching/ (runMatching
// in step 4, dispatch in step 7) imports from here, never from the files
// inside.

export { MatchingConfigError } from "./config";
export { canonicalInput, match } from "./match";
export { EXCLUSION_TEXTS, offerReasons, schoolReason } from "./reasons";
export {
  ALGORITHM_VERSION,
  type BusyPeriod,
  type Candidate,
  type MatchingConfig,
  type MatchingInput,
  type MatchingResult,
  type ShiftResult,
  type ShiftToFill,
  type Urgency,
} from "./types";
