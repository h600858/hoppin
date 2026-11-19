import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { schemas } from "../generated/schemas";
import type {
  Absence,
  Assignment,
  Availability,
  ClaimShiftRequest,
  ClaimShiftResponse,
  Decision,
  DeclineOfferRequest,
  DeclineOfferResponse,
  Escalation,
  Offer,
  School,
  SchoolConfig,
  Shift,
  ShiftEvent,
  Staff,
  Substitute,
  Tenant,
  TimetableEntry,
  UndoClaimRequest,
  UndoClaimResponse,
  WithdrawAbsenceRequest,
  WithdrawAbsenceResponse,
} from "../generated/types";

/** Maps each collection schema to its generated TypeScript type. */
export interface SchemaTypes {
  tenant: Tenant;
  school: School;
  schoolConfig: SchoolConfig;
  staff: Staff;
  substitute: Substitute;
  timetableEntry: TimetableEntry;
  absence: Absence;
  shift: Shift;
  shiftEvent: ShiftEvent;
  offer: Offer;
  assignment: Assignment;
  availability: Availability;
  decision: Decision;
  escalation: Escalation;
}

export type SchemaName = keyof SchemaTypes;

/** Maps each definition in callables.json to its generated TypeScript type. */
export interface CallableTypes {
  ClaimShiftRequest: ClaimShiftRequest;
  ClaimShiftResponse: ClaimShiftResponse;
  UndoClaimRequest: UndoClaimRequest;
  UndoClaimResponse: UndoClaimResponse;
  DeclineOfferRequest: DeclineOfferRequest;
  DeclineOfferResponse: DeclineOfferResponse;
  WithdrawAbsenceRequest: WithdrawAbsenceRequest;
  WithdrawAbsenceResponse: WithdrawAbsenceResponse;
}

export type CallableDefinition = keyof CallableTypes;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
for (const schema of schemas) {
  ajv.addSchema(schema);
}

const BASE = "https://schema.innhopp.no";

function formatError(error: ErrorObject): string {
  return `${error.instancePath || "/"} ${error.message ?? "is invalid"}`;
}

function check<T>(id: string, data: unknown): ValidationResult<T> {
  const validator = ajv.getSchema<T>(id);
  if (!validator) {
    throw new Error(`No schema registered for ${id}`);
  }
  if (validator(data)) {
    // ajv has checked the shape, so the cast is safe.
    return { ok: true, value: data as T };
  }
  return { ok: false, errors: (validator.errors ?? []).map(formatError) };
}

/** Validates a document against the schema of its collection. */
export function validate<K extends SchemaName>(
  name: K,
  data: unknown,
): ValidationResult<SchemaTypes[K]> {
  return check<SchemaTypes[K]>(`${BASE}/${name}.schema.json`, data);
}

/** Validates a callable request or response against callables.json. */
export function validateCallable<K extends CallableDefinition>(
  name: K,
  data: unknown,
): ValidationResult<CallableTypes[K]> {
  return check<CallableTypes[K]>(`${BASE}/callables.json#/$defs/${name}`, data);
}
