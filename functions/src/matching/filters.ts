import type { HardFilterName } from "../generated/types";
import { isoWeek, toLocal } from "./local_time";
import type { Candidate, MatchingInput, ShiftToFill, Urgency } from "./types";
import { isUrgentOrCritical, urgencyOf } from "./urgency";

// Hard filters (plan 7.2). They run before any scoring, and a candidate who
// fails one can never come back through a high score. Only the first
// filter that fails is reported, so the order below is the order in
// decisions and in the explanation to the school.

/** What every filter needs to know about the shift, computed once. */
export interface ShiftContext {
  toFill: ShiftToFill;
  /** Local date of the shift start. */
  date: string;
  /** ISO week of the local date. */
  week: string;
  urgency: Urgency;
}

export function shiftContext(toFill: ShiftToFill, input: MatchingInput): ShiftContext {
  const date = toLocal(toFill.shift.startsAt, input.timeZone).date;
  return {
    toFill,
    date,
    week: isoWeek(date),
    urgency: urgencyOf(toFill.shift.startsAt, input.now, input.config.waves),
  };
}

interface HardFilter {
  name: HardFilterName;
  /** False when the school has switched the filter off. */
  enabled: (input: MatchingInput) => boolean;
  excludes: (candidate: Candidate, context: ShiftContext, input: MatchingInput) => boolean;
}

const always = () => true;

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  // Half-open intervals: a period ending 08:30 does not collide with one starting 08:30.
  return Date.parse(aStart) < Date.parse(bEnd) && Date.parse(bStart) < Date.parse(aEnd);
}

export const HARD_FILTERS: readonly HardFilter[] = [
  {
    // Rule 10: always on, cannot be configured.
    name: "police_certificate",
    enabled: always,
    excludes: (candidate, context) => {
      const certificate = candidate.substitute.qualifications.policeCertificate;
      return certificate === null || certificate.expiresOn <= context.date;
    },
  },
  {
    name: "inactive",
    enabled: always,
    excludes: (candidate) => candidate.substitute.status !== "active",
  },
  {
    name: "role",
    enabled: (input) => input.config.filters.roleMatch,
    excludes: (candidate, context) => !candidate.substitute.roles.includes(context.toFill.shift.role),
  },
  {
    name: "time_collision",
    enabled: (input) => input.config.filters.timeCollision,
    excludes: (candidate, context) => {
      const { startsAt, endsAt } = context.toFill.shift;
      return candidate.busy.some((period) => overlaps(period.startsAt, period.endsAt, startsAt, endsAt));
    },
  },
  {
    name: "class_block",
    enabled: (input) => input.config.filters.classBlocks,
    excludes: (candidate, context) => {
      const { schoolId, className } = context.toFill.shift;
      return (
        className !== null &&
        candidate.substitute.classBlocks.some(
          (block) => block.schoolId === schoolId && block.className === className,
        )
      );
    },
  },
  {
    // Days with assignments in the same week, counting the shift's own day once.
    name: "working_time_limit",
    enabled: (input) => input.config.filters.workingTimeLimits,
    excludes: (candidate, context, input) => {
      const days = new Set([context.date]);
      for (const period of candidate.busy) {
        if (period.kind !== "assignment") {
          continue;
        }
        const date = toLocal(period.startsAt, input.timeZone).date;
        if (isoWeek(date) === context.week) {
          days.add(date);
        }
      }
      return days.size > candidate.substitute.preferences.maxDaysPerWeek;
    },
  },
  {
    // Applies when the shift requires it or its subject is on the school's list.
    name: "formal_competence",
    enabled: always,
    excludes: (candidate, context, input) => {
      const { shift } = context.toFill;
      const { formalCompetence, formalCompetenceSubjects } = input.config.filters;
      const required =
        shift.requiresFormalCompetence ||
        (shift.subject !== null && formalCompetenceSubjects.includes(shift.subject));
      if (!required) {
        return false;
      }
      const qualifications = candidate.substitute.qualifications;
      if (formalCompetence.requireTeacherEducation && !qualifications.teacherEducation) {
        return true;
      }
      if (shift.subject === null) {
        return false;
      }
      const qualified = qualifications.teachingSubjects.some(
        (teaching) =>
          teaching.subject === shift.subject &&
          teaching.level >= formalCompetence.minLevel &&
          (shift.grade === null || teaching.grades.includes(shift.grade)),
      );
      return !qualified;
    },
  },
  {
    name: "already_asked",
    enabled: (input) => input.config.filters.alreadyAsked,
    excludes: (candidate, context) => context.toFill.alreadyAskedSubstituteIds.includes(candidate.id),
  },
  {
    // Plan 7.4: no new offer while earlier ones are unanswered, except when it is urgent.
    name: "open_offer",
    enabled: always,
    excludes: (candidate, context, input) => {
      if (isUrgentOrCritical(context.urgency)) {
        return false;
      }
      const otherOpenOffers = candidate.openOfferShiftIds.filter((id) => id !== context.toFill.id);
      return otherOpenOffers.length >= input.config.filters.maxOpenOffersPerSubstitute;
    },
  },
];

/** The first hard filter that excludes the candidate from the shift, or null. */
export function excludedBy(
  candidate: Candidate,
  context: ShiftContext,
  input: MatchingInput,
): HardFilterName | null {
  for (const filter of HARD_FILTERS) {
    if (filter.enabled(input) && filter.excludes(candidate, context, input)) {
      return filter.name;
    }
  }
  return null;
}
