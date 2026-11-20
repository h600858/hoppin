import { describe, expect, it } from "vitest";
import type { SubstituteStats } from "../generated/types";
import { candidate, input, shift, substitute, toFill } from "../testing/matching_builders";
import { shiftContext } from "./filters";
import {
  acceptLikelihood,
  classFamiliarity,
  explorationBonus,
  fairness,
  poolStats,
  preferenceMatch,
  proximity,
  reliability,
  scoreCandidate,
  subjectMatch,
} from "./score";

// The score function (plan 7.3 and appendix B). Every component is 0 to 1.
// Where a substitute has no history, the historical components use the
// neutral prior 0.5.

/** History of an experienced substitute. Override what the test needs. */
function stats(overrides: Partial<SubstituteStats> = {}): SubstituteStats {
  return {
    tenantId: "fjellvik",
    substituteId: "sub-1",
    computedAt: "2026-11-19T01:00:00.000Z",
    offersTotal: 20,
    offersAccepted: 15,
    offeredByWeekday: [4, 4, 4, 4, 4, 0, 0],
    acceptedByWeekday: [3, 3, 3, 3, 3, 0, 0],
    assignmentsTotal: 15,
    assignmentsLast30Days: 2,
    attendanceRate: 1,
    lateCancellationRate: 0,
    schoolRating: 5,
    classVisits: [],
    lastOfferedAt: null,
    ...overrides,
  };
}

const teaching = (subject: "matematikk" | "naturfag" | "norsk" | "musikk", grades: number[]) =>
  substitute({
    qualifications: {
      ...substitute().qualifications,
      teachingSubjects: [{ subject, grades, level: 2 }],
    },
  });

describe("subjectMatch", () => {
  const mathGrade5 = shift({ subject: "matematikk", grade: 5 });

  it("is 1.0 for the subject on the grade", () => {
    expect(subjectMatch(teaching("matematikk", [5, 6, 7]), mathGrade5)).toBe(1);
  });

  it("is 0.6 for the subject on other grades", () => {
    expect(subjectMatch(teaching("matematikk", [1, 2, 3]), mathGrade5)).toBe(0.6);
  });

  it("is 0.4 for a related subject (mathematics and science)", () => {
    expect(subjectMatch(teaching("naturfag", [5]), mathGrade5)).toBe(0.4);
  });

  it("is 0.1 for an unrelated subject", () => {
    expect(subjectMatch(teaching("musikk", [5]), mathGrade5)).toBe(0.1);
  });

  it("is 0.5 for a shift without subject, for example SFO", () => {
    expect(subjectMatch(teaching("musikk", [5]), shift({ subject: null, grade: null }))).toBe(0.5);
  });
});

describe("classFamiliarity", () => {
  const visits = (...dates: string[]) =>
    stats({ classVisits: [{ schoolId: "bjorkelia", className: "5A", dates }] });

  it("is 0 without history in the class", () => {
    expect(classFamiliarity(null, shift(), "2026-11-19")).toBe(0);
    expect(classFamiliarity(stats(), shift(), "2026-11-19")).toBe(0);
  });

  it("saturates: 1 - exp(-n / 4) for recent visits", () => {
    // Visits yesterday count almost fully (half-life 120 days).
    const yesterday = Array.from({ length: 4 }, () => "2026-11-18");
    expect(classFamiliarity(visits(...yesterday), shift(), "2026-11-19")).toBeCloseTo(1 - Math.exp(-1), 2);
  });

  it("halves the weight of a visit 120 days ago", () => {
    const old = classFamiliarity(visits("2026-07-22"), shift(), "2026-11-19");
    expect(old).toBeCloseTo(1 - Math.exp(-0.5 / 4), 6);
  });

  it("only counts the same class at the same school", () => {
    const otherClass = stats({ classVisits: [{ schoolId: "bjorkelia", className: "6A", dates: ["2026-11-18"] }] });
    expect(classFamiliarity(otherClass, shift(), "2026-11-19")).toBe(0);
  });

  it("gives more for twenty visits than for three, but not much more than for ten", () => {
    const many = (n: number) => visits(...Array.from({ length: n }, () => "2026-11-12"));
    const [three, ten, twenty] = [3, 10, 20].map((n) => classFamiliarity(many(n), shift(), "2026-11-19"));
    expect(ten! - three!).toBeGreaterThan(0.3);
    expect(twenty! - ten!).toBeLessThan(0.1);
  });
});

describe("acceptLikelihood", () => {
  it("is the prior 0.5 for a new substitute", () => {
    expect(acceptLikelihood(null, 4)).toBe(0.5);
  });

  it("pulls a short history towards 0.5", () => {
    const oneOfOne = stats({
      offersTotal: 1,
      offersAccepted: 1,
      offeredByWeekday: [0, 0, 0, 1, 0, 0, 0],
      acceptedByWeekday: [0, 0, 0, 1, 0, 0, 0],
    });
    // Overall (1 + 2.5) / 6 = 0.583, Thursday (1 + 5 * 0.583) / 6 = 0.653.
    expect(acceptLikelihood(oneOfOne, 4)).toBeCloseTo(0.653, 3);
  });

  it("follows the weekday: yes on Tuesdays, no on Fridays", () => {
    const pattern = stats({
      offersTotal: 20,
      offersAccepted: 10,
      offeredByWeekday: [0, 10, 0, 0, 10, 0, 0],
      acceptedByWeekday: [0, 10, 0, 0, 0, 0, 0],
    });
    expect(acceptLikelihood(pattern, 2)).toBeGreaterThan(0.8);
    expect(acceptLikelihood(pattern, 5)).toBeLessThan(0.2);
  });
});

describe("reliability", () => {
  it("is 0.6 attendance + 0.2 no late cancellations + 0.2 rating", () => {
    expect(reliability(stats({ attendanceRate: 0.9, lateCancellationRate: 0.1, schoolRating: 4 }))).toBeCloseTo(
      0.6 * 0.9 + 0.2 * 0.9 + 0.2 * 0.8,
      6,
    );
  });

  it("uses 0.5 for each missing part", () => {
    expect(reliability(null)).toBeCloseTo(0.5, 6);
    expect(reliability(stats({ attendanceRate: 1, lateCancellationRate: null, schoolRating: null }))).toBeCloseTo(
      0.6 + 0.2 * 0.5 + 0.2 * 0.5,
      6,
    );
  });
});

describe("fairness", () => {
  // Plan 7.4: measured against the share the substitute wants, not the average.
  const wants = (days: number) => substitute({ preferences: { ...substitute().preferences, maxDaysPerWeek: days } });
  const pool = { desiredDaysTotal: 10, assignmentsLast30DaysTotal: 20 };

  it("is 0.5 when the substitute gets exactly the share they want", () => {
    expect(fairness(wants(2), stats({ assignmentsLast30Days: 4 }), pool)).toBeCloseTo(0.5, 6);
  });

  it("rises for those who get less than they want, and falls for those who get more", () => {
    expect(fairness(wants(2), stats({ assignmentsLast30Days: 0 }), pool)).toBeCloseTo(1, 6);
    // 0.5 + (0.2 - 0.4) * 5 = -0.5, clamped to 0.
    expect(fairness(wants(2), stats({ assignmentsLast30Days: 8 }), pool)).toBe(0);
  });

  it("does not treat one day a week like four", () => {
    const same = stats({ assignmentsLast30Days: 4 });
    expect(fairness(wants(4), same, pool)).toBeGreaterThan(fairness(wants(1), same, pool));
  });
});

describe("preferenceMatch", () => {
  const prefs = (overrides: Partial<ReturnType<typeof substitute>["preferences"]>) =>
    substitute({ preferences: { ...substitute().preferences, ...overrides } });

  it("is 1 when weekday, time and grade all fit", () => {
    expect(preferenceMatch(prefs({ preferredGrades: [5] }), shift(), "Europe/Oslo")).toBe(1);
  });

  it("averages 0.3 for a wrong weekday, 0.2 outside the hours and 0.5 for another grade", () => {
    const misfit = prefs({ weekdays: [1], earliestStart: "09:00", preferredGrades: [1] });
    expect(preferenceMatch(misfit, shift(), "Europe/Oslo")).toBeCloseTo((0.3 + 0.2 + 0.5) / 3, 6);
  });

  it("treats an empty list as no preference", () => {
    expect(preferenceMatch(prefs({ weekdays: [], preferredGrades: [] }), shift(), "Europe/Oslo")).toBe(1);
  });

  it("compares in local time, not UTC", () => {
    // 07:30Z is 08:30 in Oslo in November, inside 08:00 to 16:00.
    expect(preferenceMatch(prefs({ earliestStart: "08:30" }), shift(), "Europe/Oslo")).toBe(1);
  });
});

describe("proximity and explorationBonus", () => {
  it("uses 20 minutes of travel when there is no data", () => {
    expect(proximity()).toBeCloseTo(1 - 20 / 45, 6);
    expect(proximity(0)).toBe(1);
    expect(proximity(60)).toBe(0);
  });

  it("gives new substitutes up to 0.05 extra, gone after ten offers", () => {
    expect(explorationBonus(null)).toBeCloseTo(0.05, 6);
    expect(explorationBonus(stats({ offersTotal: 5 }))).toBeCloseTo(0.025, 6);
    expect(explorationBonus(stats({ offersTotal: 10 }))).toBe(0);
  });
});

describe("scoreCandidate", () => {
  const run = input();
  const context = shiftContext(toFill("shift-1"), run);

  it("is the weighted sum times 100, with the components it was built from", () => {
    const who = candidate("sub-1", { stats: stats() });
    const pool = poolStats([who]);
    const { score, components } = scoreCandidate(who, context, run, pool);
    const w = run.config.weights;
    const expected =
      w.subjectMatch * components.subjectMatch +
      w.classFamiliarity * components.classFamiliarity +
      w.acceptLikelihood * components.acceptLikelihood +
      w.reliability * components.reliability +
      w.fairness * components.fairness +
      w.preferenceMatch * components.preferenceMatch +
      w.proximity * components.proximity;
    expect(score).toBeCloseTo(expected * 100, 1);
  });

  it("keeps every component between 0 and 1 and the score between 0 and 100", () => {
    const who = candidate("sub-1");
    const { score, components } = scoreCandidate(who, context, run, poolStats([who]));
    for (const value of Object.values(components) as number[]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("ranks the subject teacher who knows the class above a newcomer without the subject", () => {
    const kari = candidate("sub-kari", {
      stats: stats({ classVisits: [{ schoolId: "bjorkelia", className: "5A", dates: ["2026-11-05", "2026-10-22"] }] }),
    });
    const per = candidate("sub-per", { substitute: teaching("musikk", [1, 2, 3]) });
    const pool = poolStats([kari, per]);
    expect(scoreCandidate(kari, context, run, pool).score).toBeGreaterThan(scoreCandidate(per, context, run, pool).score);
  });

  it("is deterministic", () => {
    const who = candidate("sub-1", { stats: stats() });
    const pool = poolStats([who]);
    expect(scoreCandidate(who, context, run, pool)).toEqual(scoreCandidate(who, context, run, pool));
  });
});

describe("poolStats", () => {
  it("sums wanted days and recent assignments over all candidates", () => {
    const a = candidate("a", { stats: stats({ assignmentsLast30Days: 3 }) });
    const b = candidate("b", { substitute: substitute({ preferences: { ...substitute().preferences, maxDaysPerWeek: 2 } }) });
    expect(poolStats([a, b])).toEqual({ desiredDaysTotal: 7, assignmentsLast30DaysTotal: 3 });
  });
});