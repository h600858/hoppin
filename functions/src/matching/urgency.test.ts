import { describe, expect, it } from "vitest";
import { config } from "../testing/matching_builders";
import { urgencyOf } from "./urgency";

const waves = config().waves;
const start = "2026-11-19T07:30:00.000Z";

/** An instant the given number of minutes before the shift starts. */
function minutesBefore(minutes: number): string {
  return new Date(Date.parse(start) - minutes * 60_000).toISOString();
}

describe("urgencyOf with the default wave table", () => {
  it.each([
    [24 * 60, "calm"],
    [16 * 60, "calm"],
    [16 * 60 - 1, "normal"],
    [120, "normal"],
    [119, "urgent"],
    [45, "urgent"],
    [44, "critical"],
    [0, "critical"],
    [-30, "critical"],
  ] as const)("%i minutes before start is %s", (minutes, urgency) => {
    expect(urgencyOf(start, minutesBefore(minutes), waves)).toBe(urgency);
  });
});
