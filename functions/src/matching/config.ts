import type { MatchingConfig, Urgency } from "./types";

/** Urgencies from least to most urgent. */
export const URGENCIES: readonly Urgency[] = ["calm", "normal", "urgent", "critical"];

const WEIGHT_TOLERANCE = 1e-6;

export class MatchingConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid matching configuration: ${problems.join("; ")}`);
    this.name = "MatchingConfigError";
  }
}

/**
 * Checks the rules JSON Schema cannot express. Throws MatchingConfigError
 * so a broken configuration stops the run instead of sending odd offers.
 */
export function assertValidConfig(config: MatchingConfig): void {
  const problems: string[] = [];

  const sum = (Object.values(config.weights) as number[]).reduce((total, weight) => total + weight, 0);
  if (Math.abs(sum - 1) > WEIGHT_TOLERANCE) {
    problems.push(`weights must sum to 1, got ${sum}`);
  }

  for (let i = 1; i < URGENCIES.length; i++) {
    const lessUrgent = config.waves[URGENCIES[i - 1]!];
    const moreUrgent = config.waves[URGENCIES[i]!];
    if (moreUrgent.minMinutesBeforeStart >= lessUrgent.minMinutesBeforeStart) {
      problems.push(
        `waves.${URGENCIES[i]}.minMinutesBeforeStart must be below waves.${URGENCIES[i - 1]}`,
      );
    }
  }

  if (problems.length > 0) {
    throw new MatchingConfigError(problems);
  }
}
