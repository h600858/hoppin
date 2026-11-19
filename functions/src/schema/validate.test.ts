import { describe, expect, it } from "vitest";
import { OFFER_STATUSES } from "../domain/offer_status";
import { SHIFT_STATUSES } from "../domain/shift_status";
import { schemas } from "../generated/schemas";
import { readFixture } from "../testing/fixtures";
import { type SchemaName, validate } from "./validate";

interface ModelFixture {
  valid: unknown[];
  invalid: { why: string; doc: unknown }[];
}

const models: SchemaName[] = [
  "school",
  "schoolConfig",
  "staff",
  "substitute",
  "timetableEntry",
  "absence",
  "shift",
  "offer",
];

describe.each(models)("%s schema", (name) => {
  const fixture = readFixture(`models/${name}.json`) as ModelFixture;

  it.each(fixture.valid.map((doc, i) => [i, doc] as const))("accepts valid example %i", (_, doc) => {
    const result = validate(name, doc);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it.each(fixture.invalid.map(({ why, doc }) => [why, doc] as const))("rejects: %s", (_, doc) => {
    expect(validate(name, doc).ok).toBe(false);
  });
});

describe("schema and status machines agree", () => {
  const defs = schemas.find((s) => s.title === "CommonDefinitions")!.$defs;

  it("ShiftStatus enum matches SHIFT_STATUSES", () => {
    expect([...defs.ShiftStatus.enum].sort()).toEqual([...SHIFT_STATUSES].sort());
  });

  it("OfferStatus enum matches OFFER_STATUSES", () => {
    expect([...defs.OfferStatus.enum].sort()).toEqual([...OFFER_STATUSES].sort());
  });
});