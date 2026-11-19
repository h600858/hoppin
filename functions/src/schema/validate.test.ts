import { describe, expect, it } from "vitest";
import { OFFER_STATUSES } from "../domain/offer_status";
import { SHIFT_STATUSES } from "../domain/shift_status";
import { schemas } from "../generated/schemas";
import { readFixture } from "../testing/fixtures";
import {
  type CallableDefinition,
  type SchemaName,
  type ValidationResult,
  validate,
  validateCallable,
} from "./validate";

interface ExampleSet {
  valid: unknown[];
  invalid: { why: string; doc: unknown }[];
}

const models: SchemaName[] = [
  "tenant",
  "school",
  "schoolConfig",
  "staff",
  "substitute",
  "timetableEntry",
  "absence",
  "shift",
  "shiftEvent",
  "offer",
  "assignment",
  "availability",
  "decision",
  "escalation",
];

function errorsOf(result: ValidationResult<unknown>): string[] {
  return result.ok ? [] : result.errors;
}

describe.each(models)("%s schema", (name) => {
  const fixture = readFixture(`models/${name}.json`) as ExampleSet;

  it.each(fixture.valid.map((doc, i) => [i, doc] as const))("accepts valid example %i", (_, doc) => {
    expect(errorsOf(validate(name, doc))).toEqual([]);
  });

  it.each(fixture.invalid.map(({ why, doc }) => [why, doc] as const))("rejects: %s", (_, doc) => {
    expect(validate(name, doc).ok).toBe(false);
  });
});

describe("callables contract", () => {
  const fixture = readFixture("callables/callables.json") as Record<CallableDefinition, ExampleSet>;

  describe.each(Object.keys(fixture) as CallableDefinition[])("%s", (name) => {
    const { valid, invalid } = fixture[name];

    it.each(valid.map((doc, i) => [i, doc] as const))("accepts valid example %i", (_, doc) => {
      expect(errorsOf(validateCallable(name, doc))).toEqual([]);
    });

    it.each(invalid.map(({ why, doc }) => [why, doc] as const))("rejects: %s", (_, doc) => {
      expect(validateCallable(name, doc).ok).toBe(false);
    });
  });

  it("has examples for every definition in callables.json", () => {
    const callables = schemas.find((s) => s.title === "Callables")!;
    expect(Object.keys(fixture).sort()).toEqual(Object.keys(callables.$defs).sort());
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
