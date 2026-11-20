import type { SchoolConfig, Shift, Substitute } from "../generated/types";
import type { Candidate, MatchingConfig, MatchingInput, ShiftToFill } from "../matching/types";
import { readFixture } from "./fixtures";

// Builders for matching tests. Each returns a valid object that passes every
// hard filter, so a test only spells out what it changes.

/** Thursday 19 November 2026, 06:00 local time. */
export const NOW = "2026-11-19T05:00:00.000Z";

/** The Bjørkelia configuration, the same as the seed. */
export function config(): MatchingConfig {
  const [doc] = readFixture("bjorkelia/schoolConfigs.json") as { data: SchoolConfig }[];
  const { version, weights, filters, waves } = structuredClone(doc!.data);
  return { version, weights, filters, waves };
}

/** 5A mathematics, Thursday 08:30 to 10:00 local time. */
export function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    tenantId: "fjellvik",
    schoolId: "bjorkelia",
    absenceId: "abs-1",
    date: "2026-11-19",
    startsAt: "2026-11-19T07:30:00.000Z",
    endsAt: "2026-11-19T09:00:00.000Z",
    role: "laerer",
    className: "5A",
    subject: "matematikk",
    grade: 5,
    requiresFormalCompetence: false,
    status: "offering",
    deadlineAt: null,
    assignedSubstituteId: null,
    assignedAt: null,
    createdAt: "2026-11-18T19:00:00.000Z",
    ...overrides,
  };
}

export function toFill(id: string, overrides: Partial<Omit<ShiftToFill, "id">> = {}): ShiftToFill {
  return { id, shift: shift(), wave: 1, alreadyAskedSubstituteIds: [], ...overrides };
}

/** A qualified, active teacher who teaches mathematics on grades 1 to 7. */
export function substitute(overrides: Partial<Substitute> = {}): Substitute {
  return {
    tenantId: "fjellvik",
    schoolIds: ["bjorkelia"],
    name: "Test Vikar",
    phone: "+4700000999",
    email: null,
    authUid: null,
    status: "active",
    roles: ["laerer"],
    qualifications: {
      teacherEducation: true,
      certificates: [],
      teachingSubjects: [{ subject: "matematikk", grades: [1, 2, 3, 4, 5, 6, 7], level: 3 }],
      policeCertificate: { issuedOn: "2024-06-14", expiresOn: "2029-06-14" },
    },
    preferences: {
      weekdays: [1, 2, 3, 4, 5],
      earliestStart: "08:00",
      latestEnd: "16:00",
      maxDaysPerWeek: 5,
      preferredGrades: [],
      notificationChannel: "push",
    },
    classBlocks: [],
    ...overrides,
  };
}

export function candidate(id: string, overrides: Partial<Omit<Candidate, "id">> = {}): Candidate {
  return { id, substitute: substitute(), stats: null, busy: [], openOfferShiftIds: [], ...overrides };
}

export function input(overrides: Partial<MatchingInput> = {}): MatchingInput {
  return {
    now: NOW,
    timeZone: "Europe/Oslo",
    config: config(),
    shifts: [toFill("shift-1")],
    candidates: [candidate("sub-1")],
    ...overrides,
  };
}
