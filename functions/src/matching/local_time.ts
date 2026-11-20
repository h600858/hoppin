// Local dates and times from UTC instants, using Intl and the school's time
// zone. Pure computation: no clock, no I/O.

export interface LocalMoment {
  /** YYYY-MM-DD in the time zone. */
  date: string;
  /** ISO weekday, Monday is 1. */
  weekday: number;
  /** Minutes since local midnight. */
  minutes: number;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function toLocal(instant: string, timeZone: string): LocalMoment {
  const millis = Date.parse(instant);
  if (Number.isNaN(millis)) {
    throw new Error(`Not an instant: ${instant}`);
  }
  const parts: Record<string, string> = {};
  for (const part of formatterFor(timeZone).formatToParts(millis)) {
    parts[part.type] = part.value;
  }
  const weekday = WEEKDAYS[parts.weekday ?? ""];
  if (weekday === undefined) {
    throw new Error(`Could not read weekday for ${instant} in ${timeZone}`);
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** "08:30" to 510. */
export function minutesOfDay(localTime: string): number {
  const [hours, minutes] = localTime.split(":").map(Number);
  return hours! * 60 + minutes!;
}

/** Whole minutes from one instant to another. Negative if `to` is earlier. */
export function minutesBetween(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 60_000);
}

/** ISO week of a local date, for example "2026-W47". Weeks start on Monday. */
export function isoWeek(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = Date.UTC(year!, month! - 1, day);
  const weekday = ((new Date(utc).getUTCDay() + 6) % 7) + 1;
  // The Thursday of the same week decides which year the week belongs to.
  const thursday = new Date(utc + (4 - weekday) * 86_400_000);
  const weekYear = thursday.getUTCFullYear();
  const firstDay = Date.UTC(weekYear, 0, 1);
  const week = Math.floor((thursday.getTime() - firstDay) / 86_400_000 / 7) + 1;
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}
