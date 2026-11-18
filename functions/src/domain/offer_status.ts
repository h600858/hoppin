export const OFFER_STATUSES = [
  "queued",
  "sent",
  "accepted",
  "declined",
  "expired",
  "superseded",
  "withdrawn",
  "undone",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

const NEXT: Readonly<Record<OfferStatus, readonly OfferStatus[]>> = {
  queued: ["sent", "withdrawn"],
  sent: ["accepted", "declined", "expired", "superseded", "withdrawn"],
  accepted: ["undone"],
  declined: [],
  expired: [],
  superseded: [],
  withdrawn: [],
  undone: [],
};

export function canTransitionOffer(from: OfferStatus, to: OfferStatus): boolean {
  return NEXT[from].includes(to);
}

export function isOfferStatus(value: unknown): value is OfferStatus {
  return typeof value === "string" && (OFFER_STATUSES as readonly string[]).includes(value);
}
