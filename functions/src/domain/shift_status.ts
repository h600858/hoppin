export const SHIFT_STATUSES = [
  "pending",
  "offering",
  "claimed",
  "confirmed",
  "completed",
  "cancelled",
  "escalated",
  "manually_assigned",
  "unfilled",
  "withdrawn",
] as const;

export type ShiftStatus = (typeof SHIFT_STATUSES)[number];

const NEXT: Readonly<Record<ShiftStatus, readonly ShiftStatus[]>> = {
  pending: ["offering", "withdrawn"],
  offering: ["claimed", "escalated", "withdrawn"],
  claimed: ["confirmed", "offering", "cancelled"],
  confirmed: ["completed"],
  completed: [],
  cancelled: [],
  escalated: ["manually_assigned", "unfilled"],
  manually_assigned: [],
  unfilled: [],
  withdrawn: [],
};

export function canTransitionShift(from: ShiftStatus, to: ShiftStatus): boolean {
  return NEXT[from].includes(to);
}

export function isShiftStatus(value: unknown): value is ShiftStatus {
  return typeof value === "string" && (SHIFT_STATUSES as readonly string[]).includes(value);
}