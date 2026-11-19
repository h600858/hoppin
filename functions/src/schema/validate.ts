import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { schemas } from "../generated/schemas";
import type { Offer, Shift } from "../generated/types";

/** Maps each collection schema to its generated TypeScript type. */
export interface SchemaTypes {
  shift: Shift;
  offer: Offer;
}

export type SchemaName = keyof SchemaTypes;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
for (const schema of schemas) {
  ajv.addSchema(schema);
}

function schemaId(name: SchemaName): string {
  return `https://schema.innhopp.no/${name}.schema.json`;
}

function formatError(error: ErrorObject): string {
  return `${error.instancePath || "/"} ${error.message ?? "is invalid"}`;
}

export function validate<K extends SchemaName>(
  name: K,
  data: unknown,
): ValidationResult<SchemaTypes[K]> {
  const check = ajv.getSchema<SchemaTypes[K]>(schemaId(name));
  if (!check) {
    throw new Error(`No schema registered for ${name}`);
  }
  if (check(data)) {
    // ajv has checked the shape, so the cast is safe.
    return { ok: true, value: data as SchemaTypes[K] };
  }
  return { ok: false, errors: (check.errors ?? []).map(formatError) };
}