import { describe, expect, it } from "vitest";
import { readFixture } from "../testing/fixtures";
import { type SchemaName, validate } from "./validate";

// The seed data for the fictional Bjørkelia skole (scripts/seed). These tests
// make sure the seed is valid and consistent before it reaches the emulator.

interface SeedDoc {
  id: string;
  data: Record<string, unknown>;
}

const collections: [file: string, schema: SchemaName][] = [
  ["tenants", "tenant"],
  ["schools", "school"],
  ["schoolConfigs", "schoolConfig"],
  ["staff", "staff"],
  ["substitutes", "substitute"],
  ["timetable", "timetableEntry"],
];

function load(file: string): SeedDoc[] {
  return readFixture(`bjorkelia/${file}.json`) as SeedDoc[];
}

const ids = (file: string) => new Set(load(file).map((doc) => doc.id));

describe.each(collections)("bjorkelia/%s.json", (file, schema) => {
  const docs = load(file);

  it("has unique document IDs", () => {
    expect(new Set(docs.map((doc) => doc.id)).size).toBe(docs.length);
  });

  it.each(docs.map((doc) => [doc.id, doc] as const))("%s matches the schema", (_, doc) => {
    const result = validate(schema, doc.data);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });
});

describe("bjorkelia references", () => {
  const tenants = ids("tenants");
  const schools = ids("schools");
  const staff = ids("staff");

  it("every document points at an existing tenant and school", () => {
    for (const [file] of collections.filter(([file]) => file !== "tenants")) {
      for (const { id, data } of load(file)) {
        expect(tenants, `${file}/${id}`).toContain(data.tenantId);
        if (file === "schools") {
          continue;
        }
        const schoolIds =
          data.schoolId === undefined ? (data.schoolIds as string[]) : [data.schoolId as string];
        for (const schoolId of schoolIds) {
          expect(schools, `${file}/${id}`).toContain(schoolId);
        }
      }
    }
  });

  it("schoolConfigs use the school ID as document ID", () => {
    for (const { id, data } of load("schoolConfigs")) {
      expect(id).toBe(data.schoolId);
    }
  });

  it("timetable and escalation contacts point at existing staff", () => {
    for (const { id, data } of load("timetable")) {
      expect(staff, `timetable/${id}`).toContain(data.staffId);
    }
    for (const { data } of load("schools")) {
      for (const staffId of data.escalationStaffIds as string[]) {
        expect(staff).toContain(staffId);
      }
    }
  });

  it("no staff member is in two places at once", () => {
    const busy = new Map<string, [string, string][]>();
    for (const { data } of load("timetable")) {
      const key = `${String(data.staffId)} day ${String(data.weekday)}`;
      busy.set(key, [...(busy.get(key) ?? []), [data.startTime as string, data.endTime as string]]);
    }
    for (const [key, periods] of busy) {
      const sorted = [...periods].sort(([a], [b]) => a.localeCompare(b));
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]![1] <= sorted[i]![0], `${key} overlaps`).toBe(true);
      }
    }
  });

  it("contains the edge cases the matching engine tests rely on", () => {
    const substitutes = load("substitutes").map((doc) => doc.data);
    const certificate = (s: Record<string, unknown>) =>
      (s.qualifications as { policeCertificate: { expiresOn: string } | null }).policeCertificate;

    expect(substitutes.some((s) => certificate(s) === null)).toBe(true);
    expect(substitutes.some((s) => (certificate(s)?.expiresOn ?? "9999") < "2026-11-01")).toBe(true);
    expect(substitutes.some((s) => s.status === "paused")).toBe(true);
    expect(substitutes.some((s) => s.status === "left")).toBe(true);
    expect(substitutes.some((s) => (s.classBlocks as unknown[]).length > 0)).toBe(true);
  });
});
