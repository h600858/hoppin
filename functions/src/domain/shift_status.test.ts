import { describe, expect, it } from "vitest";
import { readFixture } from "../testing/fixtures";
import { OFFER_STATUSES, canTransitionOffer, canTransitionOffer, isOfferStatus } from "./shift_status";

interface TransitionFixture {
  statuses: string[];
  allowed: [string, string][];
}

const fixture = readFixture("state-machines/offer-transitions.json") as TransitionFixture;
const allowed = new Set(fixture.allowed.map(([from, to]) => `${from}->${to}`));

describe("shift status machine", () => {
  it("has exactly the statuses in the shared fixture", () => {
    expect([...OFFER_STATUSES].sort()).toEqual([...fixture.statuses].sort());
  });

  // Every possible pair, so no transition can sneak in untested.
  for (const from of OFFER_STATUSES) {
    for (const to of OFFER_STATUSES) {
      const expected = allowed.has(`${from}->${to}`);
      it(`${from} -> ${to} is ${expected ? "allowed" : "rejected"}`, () => {
        expect(canTransitionOffer(from, to)).toBe(expected);
      });
    }
  }

  it("recognises valid status strings only", () => {
    expect(isOfferStatus("offering")).toBe(true);
    expect(isOfferStatus("Offering")).toBe(false);
    expect(isOfferStatus(42)).toBe(false);
  });
});