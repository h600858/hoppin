import { describe, expect, it } from "vitest";
import type { Substitute, SubstituteStats } from "../generated/types";
import { readFixture } from "../testing/fixtures";
import { candidate, config, input, NOW, shift, substitute, toFill } from "../testing/matching_builders";
import { MatchingConfigError } from "./config";
import { canonicalInput, match } from "./match";
import type { Candidate, MatchingInput, MatchingResult } from "./types";

// The whole engine. The first test is the one plan appendix B calls the
// proof that the core of the product works.

const CLASSES = ["1A", "2A", "3A", "4A", "5A", "6A"];
const SUBJECTS = ["norsk", "matematikk", "engelsk", "naturfag", "samfunnsfag", "krle"] as const;

/** History of an experienced substitute who knows the given classes well. */
function history(id: string, classes: string[]): SubstituteStats {
  return {
    tenantId: "fjellvik",
    substituteId: id,
    computedAt: "2026-11-19T01:00:00.000Z",
    offersTotal: 40,
    offersAccepted: 36,
    offeredByWeekday: [8, 8, 8, 8, 8, 0, 0],
    acceptedByWeekday: [7, 7, 7, 8, 7, 0, 0],
    assignmentsTotal: 36,
    assignmentsLast30Days: 3,
    attendanceRate: 1,
    lateCancellationRate: 0,
    schoolRating: 5,
    classVisits: classes.map((className) => ({
      schoolId: "bjorkelia",
      className,
      dates: ["2026-10-08", "2026-10-22", "2026-11-05", "2026-11-12"],
    })),
    lastOfferedAt: null,
  };
}

function teacher(subjects: readonly string[], grades: number[]): Substitute {
  return substitute({
    qualifications: {
      ...substitute().qualifications,
      teachingSubjects: subjects.map((subject) => ({
        subject: subject as (typeof SUBJECTS)[number],
        grades,
        level: 3,
      })),
    },
  });
}

/** Six shifts at the same time, one per class, each in its own subject. */
function sixShifts() {
  return CLASSES.map((className, j) =>
    toFill(`shift-${className}`, {
      shift: shift({ className, grade: j + 1, subject: SUBJECTS[j]! }),
    }),
  );
}

/**
 * Twenty candidates. Five "stars" teach everything and know every class.
 * The other fifteen each teach one subject on the right grade, without
 * history in the class.
 */
function twentyCandidates(): Candidate[] {
  const stars = Array.from({ length: 5 }, (_, i) =>
    candidate(`star-${i + 1}`, {
      substitute: teacher(SUBJECTS, [1, 2, 3, 4, 5, 6, 7]),
      stats: history(`star-${i + 1}`, CLASSES),
    }),
  );
  const others = Array.from({ length: 15 }, (_, i) =>
    candidate(`sub-${String(i + 1).padStart(2, "0")}`, {
      substitute: teacher([SUBJECTS[i % 6]!], [(i % 6) + 1]),
    }),
  );
  return [...stars, ...others];
}

const scoreOf = (result: MatchingResult, shiftId: string, substituteId: string) =>
  result.shifts.find((s) => s.shiftId === shiftId)!.candidates.find((c) => c.substituteId === substituteId)!.score!;

/** Total score of the chosen pairs. */
function totalScore(result: MatchingResult, picks: Map<string, string[]>): number {
  let sum = 0;
  for (const [shiftId, ids] of picks) {
    for (const id of ids) {
      sum += scoreOf(result, shiftId, id);
    }
  }
  return sum;
}

/** What the engine picked, per shift. */
const picksOf = (result: MatchingResult) =>
  new Map(result.shifts.map((s) => [s.shiftId, s.selectedSubstituteIds]));

/**
 * The approach plan 7.4 warns about, made as fair as possible: shift by
 * shift, take the best candidates no earlier shift has taken. With
 * `disjoint: false` it is the naive version that asks the same people again.
 */
function greedy(result: MatchingResult, { disjoint }: { disjoint: boolean }): Map<string, string[]> {
  const taken = new Set<string>();
  const picks = new Map<string, string[]>();
  for (const s of result.shifts) {
    const best = s.candidates
      .filter((c) => c.score !== null && !(disjoint && taken.has(c.substituteId)))
      .slice(0, s.slots)
      .map((c) => c.substituteId);
    best.forEach((id) => taken.add(id));
    picks.set(s.shiftId, best);
  }
  return picks;
}

describe("match: six classes, twenty candidates, five stars (plan appendix B)", () => {
  const run = input({ shifts: sixShifts(), candidates: twentyCandidates() });
  const result = match(run);
  const picks = picksOf(result);
  const everyPick = [...picks.values()].flat();

  it("gives no candidate more than one offer", () => {
    expect(new Set(everyPick).size).toBe(everyPick.length);
  });

  it("fills every slot on all six shifts", () => {
    for (const s of result.shifts) {
      expect(s.urgency).toBe("normal");
      expect(s.selectedSubstituteIds, s.shiftId).toHaveLength(3);
    }
  });

  it("scores higher in total than the best shift by shift greedy", () => {
    expect(totalScore(result, picks)).toBeGreaterThan(totalScore(result, greedy(result, { disjoint: true })));
  });

  it("shows the problem it solves: naive greedy asks each star about several classes", () => {
    const naive = [...greedy(result, { disjoint: false }).values()].flat();
    const starOffers = naive.filter((id) => id.startsWith("star-")).length;
    expect(starOffers).toBeGreaterThan(5);
  });
});

describe("match", () => {
  it("moves a candidate to where only they can help (the greedy trap)", () => {
    // Kari is best for both shifts. Per is blocked from 2A. Shift by shift,
    // 1A would take Kari and 2A would get nobody.
    const oneSlot = config();
    oneSlot.waves.normal.waveSize = 1;
    const run = input({
      config: oneSlot,
      shifts: [
        toFill("shift-1A", { shift: shift({ className: "1A", grade: 1, subject: "norsk" }) }),
        toFill("shift-2A", { shift: shift({ className: "2A", grade: 2, subject: "norsk" }) }),
      ],
      candidates: [
        candidate("kari", { substitute: teacher(["norsk"], [1, 2]), stats: history("kari", ["1A", "2A"]) }),
        candidate("per", {
          substitute: {
            ...teacher(["norsk"], [1]),
            classBlocks: [{ schoolId: "bjorkelia", className: "2A", reason: "Avtalt", since: "2026-09-01" }],
          },
        }),
      ],
    });
    const greedyFirst = greedy(match(run), { disjoint: true });
    expect(greedyFirst.get("shift-2A")).toEqual([]);

    const picks = picksOf(match(run));
    expect(picks.get("shift-1A")).toEqual(["per"]);
    expect(picks.get("shift-2A")).toEqual(["kari"]);
  });

  it("lets an urgent shift choose before a calm one when candidates are scarce", () => {
    const tomorrow = toFill("shift-calm", {
      shift: shift({ startsAt: "2026-11-20T07:30:00.000Z", endsAt: "2026-11-20T09:00:00.000Z", date: "2026-11-20" }),
    });
    const soon = toFill("shift-urgent", {
      // 06:00 local now, starts 07:00 local: one hour, urgent.
      shift: shift({ startsAt: "2026-11-19T06:00:00.000Z", endsAt: "2026-11-19T07:00:00.000Z", subject: "musikk" }),
    });
    const result = match(input({ shifts: [tomorrow, soon], candidates: [candidate("only-one")] }));
    const urgent = result.shifts.find((s) => s.shiftId === "shift-urgent")!;
    const calm = result.shifts.find((s) => s.shiftId === "shift-calm")!;

    expect(urgent.urgency).toBe("urgent");
    expect(calm.urgency).toBe("calm");
    // The calm shift is mathematics, which the candidate teaches, so it scores higher...
    expect(scoreOf(result, "shift-calm", "only-one")).toBeGreaterThan(scoreOf(result, "shift-urgent", "only-one"));
    // ...but the urgent shift still gets the candidate.
    expect(urgent.selectedSubstituteIds).toEqual(["only-one"]);
    expect(calm.selectedSubstituteIds).toEqual([]);
  });

  it("asks every qualified candidate about a critical shift, still once each", () => {
    const critical = (id: string, className: string) =>
      toFill(id, {
        shift: shift({ className, startsAt: "2026-11-19T05:20:00.000Z", endsAt: "2026-11-19T07:00:00.000Z" }),
      });
    const candidates = Array.from({ length: 7 }, (_, i) => candidate(`sub-${i}`));
    const result = match(input({ shifts: [critical("shift-x", "5A"), critical("shift-y", "6A")], candidates }));
    const all = result.shifts.flatMap((s) => s.selectedSubstituteIds);

    expect(result.shifts.map((s) => s.urgency)).toEqual(["critical", "critical"]);
    expect(all).toHaveLength(7);
    expect(new Set(all).size).toBe(7);
  });

  it("reports excluded candidates with their filter and never selects them", () => {
    const expired = candidate("expired", {
      substitute: substitute({
        qualifications: { ...substitute().qualifications, policeCertificate: { issuedOn: "2020-01-01", expiresOn: "2025-10-01" } },
      }),
    });
    const result = match(input({ candidates: [expired, candidate("ok")] }));
    const [s] = result.shifts;
    const reported = s!.candidates.find((c) => c.substituteId === "expired")!;

    expect(reported).toEqual({
      substituteId: "expired",
      excludedBy: "police_certificate",
      score: null,
      components: null,
      selected: false,
    });
    expect(s!.selectedSubstituteIds).toEqual(["ok"]);
    // Scored candidates come first, excluded last.
    expect(s!.candidates.map((c) => c.substituteId)).toEqual(["ok", "expired"]);
  });

  it("gives the same answer whatever order the input comes in", () => {
    const run = input({ shifts: sixShifts(), candidates: twentyCandidates() });
    const shuffled: MatchingInput = {
      ...run,
      shifts: [...run.shifts].reverse(),
      candidates: [...run.candidates].reverse(),
    };
    expect(match(shuffled)).toEqual(match(run));
  });

  it("breaks ties in favour of the candidate with fewer recent assignments", () => {
    const busy = candidate("a-busy", { stats: { ...history("a-busy", []), assignmentsLast30Days: 6 } });
    const quiet = candidate("b-quiet", { stats: { ...history("b-quiet", []), assignmentsLast30Days: 6 } });
    quiet.stats!.assignmentsLast30Days = 1;
    const oneSlot = config();
    oneSlot.waves.normal.waveSize = 1;
    // Same everything except recent assignments, which also lifts fairness for b-quiet.
    const result = match(input({ config: oneSlot, candidates: [busy, quiet] }));
    expect(result.shifts[0]!.selectedSubstituteIds).toEqual(["b-quiet"]);
  });

  it("stops on a broken configuration instead of sending odd offers", () => {
    const broken = config();
    broken.weights.fairness = 0.5;
    expect(() => match(input({ config: broken }))).toThrow(MatchingConfigError);
  });

  it("records the algorithm and configuration version", () => {
    const result = match(input());
    expect(result.algorithmVersion).toBe("flow-1");
    expect(result.configVersion).toBe(1);
  });
});

describe("match with the Bjørkelia seed", () => {
  const seed = readFixture("bjorkelia/substitutes.json") as { id: string; data: Substitute }[];
  const candidates = seed.map(({ id, data }) => candidate(id, { substitute: data }));
  const shifts = [
    toFill("shift-5A", { shift: shift({ className: "5A", grade: 5, subject: "matematikk" }) }),
    toFill("shift-2A", { shift: shift({ className: "2A", grade: 2, subject: "norsk" }) }),
    toFill("shift-sfo", {
      shift: shift({
        role: "sfo",
        className: null,
        subject: null,
        grade: null,
        startsAt: "2026-11-19T12:15:00.000Z",
        endsAt: "2026-11-19T15:30:00.000Z",
      }),
    }),
  ];
  const result = match(input({ now: NOW, shifts, candidates }));

  it("excludes the seed's edge cases for the right reason", () => {
    const reasons = new Map(result.shifts[0]!.candidates.map((c) => [c.substituteId, c.excludedBy]));
    expect(reasons.get("sub-ola")).toBe("police_certificate");
    expect(reasons.get("sub-stian")).toBe("police_certificate");
    expect(reasons.get("sub-hilde")).toBe("inactive");
    expect(reasons.get("sub-randi")).toBe("inactive");
  });

  it("fills all three shifts with different people", () => {
    const all = result.shifts.flatMap((s) => s.selectedSubstituteIds);
    for (const s of result.shifts) {
      expect(s.selectedSubstituteIds, s.shiftId).toHaveLength(3);
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it("only sends SFO shifts to substitutes with the SFO role", () => {
    const sfo = result.shifts.find((s) => s.shiftId === "shift-sfo")!;
    for (const id of sfo.selectedSubstituteIds) {
      expect(seed.find((s) => s.id === id)!.data.roles).toContain("sfo");
    }
  });
});

describe("canonicalInput", () => {
  const run = input({ shifts: sixShifts(), candidates: twentyCandidates() });

  it("is the same text whatever order shifts, candidates and keys come in", () => {
    const reordered: MatchingInput = {
      candidates: [...run.candidates].reverse(),
      shifts: [...run.shifts].reverse(),
      config: run.config,
      timeZone: run.timeZone,
      now: run.now,
    };
    expect(canonicalInput(reordered)).toBe(canonicalInput(run));
  });

  it("changes when anything in the input changes", () => {
    const changed = structuredClone(run);
    changed.candidates[0]!.substitute.preferences.maxDaysPerWeek = 2;
    expect(canonicalInput(changed)).not.toBe(canonicalInput(run));
  });
});
