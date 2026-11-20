import { describe, expect, it } from "vitest";
import type { HardFilterName } from "../generated/types";
import { candidate, input, shift, substitute, toFill } from "../testing/matching_builders";
import { excludedBy, shiftContext } from "./filters";
import type { Candidate, MatchingInput, ShiftToFill } from "./types";

function check(
  who: Candidate,
  target: ShiftToFill = toFill("shift-1"),
  run: MatchingInput = input(),
): HardFilterName | null {
  return excludedBy(who, shiftContext(target, run), run);
}

/** The same input with every filter a school can switch off switched off. */
function allFiltersOff(): MatchingInput {
  const run = input();
  Object.assign(run.config.filters, {
    roleMatch: false,
    timeCollision: false,
    classBlocks: false,
    workingTimeLimits: false,
    alreadyAsked: false,
    formalCompetenceSubjects: [],
  });
  return run;
}

const base = substitute();

describe("hard filters", () => {
  it("lets a qualified, free substitute through", () => {
    expect(check(candidate("sub-1"))).toBeNull();
  });

  describe("police_certificate (rule 10)", () => {
    const withCertificate = (expiresOn: string | null) =>
      candidate("sub-1", {
        substitute: substitute({
          qualifications: {
            ...base.qualifications,
            policeCertificate: expiresOn === null ? null : { issuedOn: "2021-01-01", expiresOn },
          },
        }),
      });

    it("excludes a substitute without a certificate", () => {
      expect(check(withCertificate(null))).toBe("police_certificate");
    });

    it("excludes a certificate that expires on the day of the shift", () => {
      expect(check(withCertificate("2026-11-19"))).toBe("police_certificate");
    });

    it("accepts a certificate that expires the day after", () => {
      expect(check(withCertificate("2026-11-20"))).toBeNull();
    });

    it("still applies when every configurable filter is switched off", () => {
      expect(check(withCertificate("2025-10-01"), toFill("shift-1"), allFiltersOff())).toBe("police_certificate");
    });
  });

  it("inactive: excludes paused substitutes and those who have left, always", () => {
    for (const status of ["paused", "left"] as const) {
      const who = candidate("sub-1", { substitute: substitute({ status }) });
      expect(check(who)).toBe("inactive");
      expect(check(who, toFill("shift-1"), allFiltersOff())).toBe("inactive");
    }
  });

  it("role: excludes an SFO-only substitute from a teacher shift, unless switched off", () => {
    const who = candidate("sub-1", { substitute: substitute({ roles: ["sfo"] }) });
    expect(check(who)).toBe("role");
    expect(check(who, toFill("shift-1"), allFiltersOff())).toBeNull();
  });

  describe("time_collision", () => {
    const busy = (startsAt: string, endsAt: string) =>
      candidate("sub-1", { busy: [{ kind: "assignment", startsAt, endsAt }] });

    it("excludes an overlapping assignment", () => {
      expect(check(busy("2026-11-19T08:00:00.000Z", "2026-11-19T10:00:00.000Z"))).toBe("time_collision");
    });

    it("excludes a period the substitute marked unavailable", () => {
      const who = candidate("sub-1", {
        busy: [{ kind: "unavailable", startsAt: "2026-11-18T23:00:00.000Z", endsAt: "2026-11-19T23:00:00.000Z" }],
      });
      expect(check(who)).toBe("time_collision");
    });

    it("allows back to back: a period ending when the shift starts", () => {
      expect(check(busy("2026-11-19T06:30:00.000Z", "2026-11-19T07:30:00.000Z"))).toBeNull();
    });
  });

  it("class_block: excludes a blocked class at the same school only", () => {
    const blocked = (schoolId: string) =>
      candidate("sub-1", {
        substitute: substitute({
          classBlocks: [{ schoolId, className: "5A", reason: "Avtalt", since: "2026-09-01" }],
        }),
      });
    expect(check(blocked("bjorkelia"))).toBe("class_block");
    expect(check(blocked("annen-skole"))).toBeNull();
  });

  describe("working_time_limit", () => {
    const twoDaysMax = (busyDays: string[]) =>
      candidate("sub-1", {
        substitute: substitute({ preferences: { ...base.preferences, maxDaysPerWeek: 2 } }),
        busy: busyDays.map((day) => ({
          kind: "assignment" as const,
          startsAt: `${day}T07:30:00.000Z`,
          endsAt: `${day}T09:00:00.000Z`,
        })),
      });

    it("excludes a third day in the same week", () => {
      expect(check(twoDaysMax(["2026-11-16", "2026-11-17"]))).toBe("working_time_limit");
    });

    it("counts a second assignment on the same day as no extra day", () => {
      const sameDayLater = toFill("shift-1", {
        shift: shift({ startsAt: "2026-11-19T11:00:00.000Z", endsAt: "2026-11-19T12:00:00.000Z" }),
      });
      expect(check(twoDaysMax(["2026-11-16", "2026-11-19"]), sameDayLater)).toBeNull();
    });

    it("ignores assignments in other weeks", () => {
      expect(check(twoDaysMax(["2026-11-09", "2026-11-10", "2026-11-23"]))).toBeNull();
    });
  });

  describe("formal_competence", () => {
    const required = toFill("shift-1", { shift: shift({ requiresFormalCompetence: true }) });
    const teaching = (level: number, grades: number[], teacherEducation = true) =>
      candidate("sub-1", {
        substitute: substitute({
          qualifications: {
            ...base.qualifications,
            teacherEducation,
            teachingSubjects: [{ subject: "matematikk", grades, level }],
          },
        }),
      });

    it("does not apply when the shift does not require it", () => {
      expect(check(teaching(1, [5], false))).toBeNull();
    });

    it("accepts teacher education and level 3 in the subject on the grade", () => {
      expect(check(teaching(3, [5, 6, 7]), required)).toBeNull();
    });

    it("excludes a lower level, the wrong grade, or no teacher education", () => {
      expect(check(teaching(2, [5]), required)).toBe("formal_competence");
      expect(check(teaching(3, [1, 2, 3]), required)).toBe("formal_competence");
      expect(check(teaching(3, [5], false), required)).toBe("formal_competence");
    });

    it("applies to subjects on the school's list even when the shift does not ask", () => {
      const run = input();
      run.config.filters.formalCompetenceSubjects = ["matematikk"];
      expect(check(teaching(2, [5]), toFill("shift-1"), run)).toBe("formal_competence");
    });
  });

  it("already_asked: excludes anyone with an earlier offer on the shift", () => {
    const asked = toFill("shift-1", { alreadyAskedSubstituteIds: ["sub-1"] });
    expect(check(candidate("sub-1"), asked)).toBe("already_asked");
    expect(check(candidate("sub-1"), asked, allFiltersOff())).toBeNull();
  });

  describe("open_offer", () => {
    const waiting = candidate("sub-1", { openOfferShiftIds: ["shift-other"] });

    it("excludes a substitute with an unanswered offer when the shift is not urgent", () => {
      expect(check(waiting)).toBe("open_offer");
    });

    it("allows it when the shift is urgent", () => {
      const soon = input({ now: "2026-11-19T06:45:00.000Z" });
      expect(check(waiting, toFill("shift-1"), soon)).toBeNull();
    });

    it("follows maxOpenOffersPerSubstitute", () => {
      const run = input();
      run.config.filters.maxOpenOffersPerSubstitute = 2;
      expect(check(waiting, toFill("shift-1"), run)).toBeNull();
    });
  });

  it("reports the first filter that fails, in the documented order", () => {
    const everythingWrong = candidate("sub-1", {
      substitute: substitute({
        status: "paused",
        roles: ["sfo"],
        qualifications: { ...base.qualifications, policeCertificate: null },
      }),
    });
    expect(check(everythingWrong)).toBe("police_certificate");
  });
});
