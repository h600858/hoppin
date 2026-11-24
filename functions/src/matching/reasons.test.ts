import { describe, expect, it } from "vitest";
import type { Shift, SubstituteStats } from "../generated/types";
import { schemas } from "../generated/schemas";
import { candidate, input, shift, substitute, toFill } from "../testing/matching_builders";
import { match } from "./match";
import { EXCLUSION_TEXTS, offerReasons, schoolReason } from "./reasons";
import type { Candidate } from "./types";

const OSLO = "Europe/Oslo";

function stats(overrides: Partial<SubstituteStats> = {}): SubstituteStats {
  return {
    tenantId: "fjellvik",
    substituteId: "sub-1",
    computedAt: "2026-11-19T01:00:00.000Z",
    offersTotal: 30,
    offersAccepted: 27,
    offeredByWeekday: [6, 6, 6, 6, 6, 0, 0],
    acceptedByWeekday: [6, 6, 6, 6, 3, 0, 0],
    assignmentsTotal: 27,
    assignmentsLast30Days: 2,
    attendanceRate: 1,
    lateCancellationRate: 0,
    schoolRating: 5,
    classVisits: [],
    lastOfferedAt: null,
    ...overrides,
  };
}

/** Runs the engine for one candidate on one shift and returns what the reasons need. */
function evaluate(who: Candidate, target: Shift = shift()) {
  const result = match(input({ shifts: [toFill("shift-1", { shift: target })], candidates: [who] }));
  const evaluation = result.shifts[0]!.candidates[0]!;
  return { evaluation, components: evaluation.components! };
}

describe("offerReasons", () => {
  const kari = candidate("sub-1", {
    stats: stats({
      classVisits: [
        { schoolId: "bjorkelia", className: "5A", dates: ["2026-03-02", "2026-09-10", "2026-10-15", "2026-11-12"] },
      ],
    }),
  });

  it("leads with knowing the class, then the subject on the grade", () => {
    const { components } = evaluate(kari);
    expect(offerReasons(kari, shift(), components, OSLO).slice(0, 2)).toEqual([
      "Har hatt 5A fire ganger det siste året",
      "Underviser i matematikk på 5. trinn",
    ]);
  });

  it("counts only the last year", () => {
    const old = candidate("sub-1", {
      stats: stats({ classVisits: [{ schoolId: "bjorkelia", className: "5A", dates: ["2025-10-01", "2026-11-12"] }] }),
    });
    const { components } = evaluate(old);
    expect(offerReasons(old, shift(), components, OSLO)).toContain("Har hatt 5A én gang det siste året");
  });

  it("mentions that a new substitute is new", () => {
    const fresh = candidate("sub-1");
    const { components } = evaluate(fresh);
    expect(offerReasons(fresh, shift(), components, OSLO)).toContain("Ny i vikarlisten");
  });

  it("gives at most three reasons that fit the offer schema", () => {
    const offer = schemas.find((s) => s.title === "Offer")!;
    const { maxItems, items } = offer.properties.reasons;
    for (const who of [kari, candidate("sub-1")]) {
      const { components } = evaluate(who);
      const reasons = offerReasons(who, shift(), components, OSLO);
      expect(reasons.length).toBeLessThanOrEqual(Math.min(3, maxItems));
      for (const reason of reasons) {
        expect(reason.length).toBeGreaterThanOrEqual(items.minLength);
        expect(reason.length).toBeLessThanOrEqual(items.maxLength);
      }
    }
  });

  it("never repeats free text from the input (rule 11)", () => {
    // Free text a school might type: it must never reach a message.
    const secret = candidate("sub-1", {
      substitute: substitute({
        name: "HEMMELIG navn",
        classBlocks: [{ schoolId: "bjorkelia", className: "7A", reason: "HEMMELIG grunn", since: "2026-09-01" }],
      }),
      stats: stats(),
    });
    const target = shift({ absenceId: "HEMMELIG-fravaer" });
    const { components, evaluation } = evaluate(secret, target);
    const texts = [...offerReasons(secret, target, components, OSLO), schoolReason(secret, target, evaluation, OSLO)];
    for (const text of texts) {
      expect(text).not.toMatch(/HEMMELIG/);
    }
  });
});

describe("schoolReason", () => {
  it("adds a caution when the substitute rarely says yes on that weekday", () => {
    // Friday 20 November 2026, and this substitute says no on Fridays.
    const friday = shift({ startsAt: "2026-11-20T07:30:00.000Z", endsAt: "2026-11-20T09:00:00.000Z", date: "2026-11-20" });
    const noOnFridays = candidate("sub-1", {
      stats: stats({
        offeredByWeekday: [6, 6, 6, 6, 12, 0, 0],
        acceptedByWeekday: [6, 6, 6, 6, 0, 0, 0],
        classVisits: [{ schoolId: "bjorkelia", className: "5A", dates: ["2026-10-15", "2026-11-12"] }],
      }),
    });
    const { evaluation } = evaluate(noOnFridays, friday);
    expect(schoolReason(noOnFridays, friday, evaluation, OSLO)).toBe(
      "Har hatt 5A to ganger det siste året, men svarer sjelden ja på fredager",
    );
  });

  it("explains an exclusion in plain Norwegian", () => {
    const blocked = candidate("sub-1", {
      substitute: substitute({ classBlocks: [{ schoolId: "bjorkelia", className: "5A", reason: "x", since: "2026-09-01" }] }),
    });
    const { evaluation } = evaluate(blocked);
    expect(evaluation.excludedBy).toBe("class_block");
    expect(schoolReason(blocked, shift(), evaluation, OSLO)).toBe("Er sperret for klassen");
  });

  it("has a text for every hard filter in the schema", () => {
    const decision = schemas.find((s) => s.title === "Decision")!;
    const filterNames = decision.properties.candidates.items.properties.excludedBy.anyOf[0].enum;
    expect(Object.keys(EXCLUSION_TEXTS).sort()).toEqual([...filterNames].sort());
  });
});
