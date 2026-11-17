/**
 * All time in functions comes from a Clock. Date.now() and new Date() are
 * banned elsewhere by ESLint. Time travel in the emulator comes in step 7.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** For tests: a clock that always returns the same instant. */
export function fixedClock(instant: Date): Clock {
  return { now: () => new Date(instant.getTime()) };
}