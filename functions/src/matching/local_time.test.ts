import { describe, expect, it } from "vitest";
import { isoWeek, minutesBetween, minutesOfDay, toLocal } from "./local_time";

const OSLO = "Europe/Oslo";

describe("toLocal", () => {
  it("uses UTC+1 in winter", () => {
    expect(toLocal("2026-11-19T07:30:00.000Z", OSLO)).toEqual({ date: "2026-11-19", weekday: 4, minutes: 510 });
  });

  it("uses UTC+2 in summer", () => {
    expect(toLocal("2026-06-15T06:30:00.000Z", OSLO)).toEqual({ date: "2026-06-15", weekday: 1, minutes: 510 });
  });

  it("moves to the next local day before UTC does", () => {
    expect(toLocal("2026-11-19T23:30:00.000Z", OSLO)).toEqual({ date: "2026-11-20", weekday: 5, minutes: 30 });
  });

  it("handles the night clocks go back (25 October 2026)", () => {
    // 02:30 happens twice that night: first in summer time, then in winter time.
    expect(toLocal("2026-10-25T00:30:00.000Z", OSLO).minutes).toBe(150);
    expect(toLocal("2026-10-25T01:30:00.000Z", OSLO).minutes).toBe(150);
    expect(toLocal("2026-10-26T07:30:00.000Z", OSLO).minutes).toBe(510);
  });

  it("handles the night clocks go forward (28 March 2027)", () => {
    expect(toLocal("2027-03-28T00:59:00.000Z", OSLO).minutes).toBe(119);
    expect(toLocal("2027-03-28T01:00:00.000Z", OSLO).minutes).toBe(180);
    expect(toLocal("2027-03-29T06:30:00.000Z", OSLO).minutes).toBe(510);
  });

  it("rejects text that is not an instant", () => {
    expect(() => toLocal("08:30", OSLO)).toThrow();
  });
});

describe("minutesOfDay and minutesBetween", () => {
  it("reads HH:mm", () => {
    expect(minutesOfDay("08:30")).toBe(510);
    expect(minutesOfDay("00:00")).toBe(0);
  });

  it("counts minutes between instants, negative when going back", () => {
    expect(minutesBetween("2026-11-19T05:00:00.000Z", "2026-11-19T07:30:00.000Z")).toBe(150);
    expect(minutesBetween("2026-11-19T07:30:00.000Z", "2026-11-19T05:00:00.000Z")).toBe(-150);
  });
});

describe("isoWeek", () => {
  it.each([
    ["2026-11-19", "2026-W47"],
    ["2026-11-16", "2026-W47"],
    ["2026-11-22", "2026-W47"],
    ["2026-11-23", "2026-W48"],
    ["2026-12-28", "2026-W53"],
    ["2027-01-01", "2026-W53"],
    ["2027-01-04", "2027-W01"],
  ])("%s is in %s", (date, week) => {
    expect(isoWeek(date)).toBe(week);
  });
});
