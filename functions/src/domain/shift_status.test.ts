import { describe, expect, it } from "vitest";
import { readFixture } from "../testing/fixtures";
import { SHIFT_STATUSES, canTransitionShift, isShiftStatus } from "./shift_status";

interface TransitionFixture {
  statuses: string[];
  allowed: [string, string][];
}

const fixture = readFixture("state-machines/shift-transitions.json") as TransitionFixture;
const allowed = new Set(fixture.allowed.map(([from, to]) => `${from}->${to}`));

describe("shift status machine", () => {
  it("has exactly the statuses in the shared fixture", () => {
    expect([...SHIFT_STATUSES].sort()).toEqual([...fixture.statuses].sort());
  });

  // Every possible pair, so no transition can sneak in untested.
  for (const from of SHIFT_STATUSES) {
    for (const to of SHIFT_STATUSES) {
      const expected = allowed.has(`${from}->${to}`);
      it(`${from} -> ${to} is ${expected ? "allowed" : "rejected"}`, () => {
        expect(canTransitionShift(from, to)).toBe(expected);
      });
    }
  }

  it("recognises valid status strings only", () => {
    expect(isShiftStatus("offering")).toBe(true);
    expect(isShiftStatus("Offering")).toBe(false);
    expect(isShiftStatus(42)).toBe(false);
  });
});
