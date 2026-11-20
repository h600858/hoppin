import { URGENCIES } from "./config";
import { minutesBetween } from "./local_time";
import type { MatchingConfig, Urgency } from "./types";

/**
 * Picks the wave rule by time until the shift starts (plan 7.5): the least
 * urgent rule whose minMinutesBeforeStart is still met. A shift that has
 * already started is critical.
 */
export function urgencyOf(startsAt: string, now: string, waves: MatchingConfig["waves"]): Urgency {
  const minutesLeft = minutesBetween(now, startsAt);
  for (const urgency of URGENCIES) {
    if (minutesLeft >= waves[urgency].minMinutesBeforeStart) {
      return urgency;
    }
  }
  return "critical";
}

/** Urgent and critical shifts may go to substitutes who already have an open offer. */
export function isUrgentOrCritical(urgency: Urgency): boolean {
  return urgency === "urgent" || urgency === "critical";
}
