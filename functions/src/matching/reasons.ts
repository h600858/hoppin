import type { HardFilterName, ScoreComponents, Shift, Subject } from "../generated/types";
import { toLocal } from "./local_time";
import type { Candidate } from "./types";

// Short reasons in Norwegian, built from the components with fixed
// templates (plan 7.7). No language model (rule 2). The engine never sees
// the name of the absent person or the absence comment, so nothing here can
// leak them (rule 11).
//
// Two audiences:
//   offerReasons: shown to the substitute with the offer. Only positive.
//   schoolReason: one sentence for the school in an escalation, with a
//                 caution when there is one ("..., men svarer sjelden ja på fredager").

const SUBJECT_NAMES: Record<Subject, string> = {
  norsk: "norsk",
  matematikk: "matematikk",
  engelsk: "engelsk",
  naturfag: "naturfag",
  samfunnsfag: "samfunnsfag",
  krle: "KRLE",
  kunst_og_handverk: "kunst og håndverk",
  musikk: "musikk",
  mat_og_helse: "mat og helse",
  kroppsoving: "kroppsøving",
  fremmedsprak: "fremmedspråk",
  valgfag: "valgfag",
  annet: "andre fag",
};

const WEEKDAY_PLURALS = ["mandager", "tirsdager", "onsdager", "torsdager", "fredager", "lørdager", "søndager"];

const COUNT_WORDS = ["null", "én", "to", "tre", "fire", "fem", "seks", "sju", "åtte", "ni", "ti", "elleve", "tolv"];

/** Why a hard filter excluded someone, for the admin view and escalations. */
export const EXCLUSION_TEXTS: Record<HardFilterName, string> = {
  police_certificate: "Mangler gyldig politiattest",
  inactive: "Er ikke aktiv i vikarlisten",
  role: "Har ikke rollen oppdraget krever",
  time_collision: "Er opptatt i tidsrommet",
  class_block: "Er sperret for klassen",
  working_time_limit: "Har nådd maks antall dager denne uken",
  formal_competence: "Mangler formell kompetanse i faget",
  already_asked: "Er allerede spurt om oppdraget",
  open_offer: "Har et ubesvart tilbud",
};

const MAX_REASONS = 3;

interface Reason {
  text: string;
  /** How much this part lifted the score: weight times component. */
  strength: number;
}

/** Times the substitute has had the class the last 365 days. */
function recentVisits(candidate: Candidate, shift: Shift, shiftDate: string): number {
  const visits = candidate.stats?.classVisits.find(
    (v) => v.schoolId === shift.schoolId && v.className === shift.className,
  );
  if (visits === undefined) {
    return 0;
  }
  const [year, month, day] = shiftDate.split("-");
  const yearAgo = `${Number(year) - 1}-${month}-${day}`;
  return visits.dates.filter((date) => date >= yearAgo && date < shiftDate).length;
}

function times(count: number): string {
  const word = COUNT_WORDS[count] ?? String(count);
  return count === 1 ? `${word} gang` : `${word} ganger`;
}

function positiveReasons(
  candidate: Candidate,
  shift: Shift,
  components: ScoreComponents,
  timeZone: string,
): Reason[] {
  const reasons: Reason[] = [];
  const shiftDate = toLocal(shift.startsAt, timeZone).date;
  const weekday = toLocal(shift.startsAt, timeZone).weekday;

  if (shift.subject !== null) {
    const subject = SUBJECT_NAMES[shift.subject];
    if (components.subjectMatch === 1) {
      const where = shift.grade === null ? "" : ` på ${shift.grade}. trinn`;
      reasons.push({ text: `Underviser i ${subject}${where}`, strength: components.subjectMatch });
    } else if (components.subjectMatch === 0.6) {
      reasons.push({ text: `Underviser i ${subject} på andre trinn`, strength: components.subjectMatch });
    } else if (components.subjectMatch === 0.4) {
      reasons.push({ text: `Underviser i et beslektet fag`, strength: components.subjectMatch });
    }
  }

  const visits = shift.className === null ? 0 : recentVisits(candidate, shift, shiftDate);
  if (visits > 0) {
    reasons.push({
      text: `Har hatt ${shift.className} ${times(visits)} det siste året`,
      // Knowing the class is often what matters most for the lesson (plan 7.3).
      strength: 1 + components.classFamiliarity,
    });
  }

  if (candidate.stats !== null && components.acceptLikelihood >= 0.75) {
    reasons.push({
      text: `Sier ofte ja på ${WEEKDAY_PLURALS[weekday - 1]}`,
      strength: components.acceptLikelihood * 0.5,
    });
  }

  if (candidate.stats !== null && candidate.stats.assignmentsTotal > 0 && components.reliability >= 0.9) {
    reasons.push({ text: "Stabilt oppmøte", strength: components.reliability * 0.4 });
  }

  if (components.fairness >= 0.75) {
    reasons.push({ text: "Har hatt færre oppdrag enn ønsket i det siste", strength: components.fairness * 0.3 });
  }

  if (candidate.stats === null || candidate.stats.offersTotal < 10) {
    reasons.push({ text: "Ny i vikarlisten", strength: 0.1 });
  }

  // Strongest first. Ties keep the order above, so the result is stable.
  return reasons.sort((a, b) => b.strength - a.strength);
}

function caution(candidate: Candidate, shift: Shift, components: ScoreComponents, timeZone: string): string | null {
  const weekday = toLocal(shift.startsAt, timeZone).weekday;
  if (candidate.stats !== null && components.acceptLikelihood <= 0.3) {
    return `svarer sjelden ja på ${WEEKDAY_PLURALS[weekday - 1]}`;
  }
  if (shift.subject !== null && components.subjectMatch <= 0.1) {
    return `underviser ikke i ${SUBJECT_NAMES[shift.subject]}`;
  }
  if (components.preferenceMatch < 0.5) {
    return "passer dårlig med det vikaren har oppgitt som ønsket tid og trinn";
  }
  return null;
}

/** Up to three short positive reasons, shown to the substitute with the offer. */
export function offerReasons(
  candidate: Candidate,
  shift: Shift,
  components: ScoreComponents,
  timeZone: string,
): string[] {
  return positiveReasons(candidate, shift, components, timeZone)
    .slice(0, MAX_REASONS)
    .map((reason) => reason.text);
}

/**
 * One sentence for the school, for example
 * "Har hatt 7B ni ganger det siste året, men svarer sjelden ja på fredager".
 * Excluded candidates get the text for their filter.
 */
export function schoolReason(
  candidate: Candidate,
  shift: Shift,
  evaluation: { excludedBy: HardFilterName | null; components: ScoreComponents | null },
  timeZone: string,
): string {
  if (evaluation.excludedBy !== null) {
    return EXCLUSION_TEXTS[evaluation.excludedBy];
  }
  if (evaluation.components === null) {
    return "Ikke vurdert";
  }
  const [best] = positiveReasons(candidate, shift, evaluation.components, timeZone);
  const warning = caution(candidate, shift, evaluation.components, timeZone);
  const start = best?.text ?? "Kvalifisert for oppdraget";
  return warning === null ? start : `${start}, men ${warning}`;
}
