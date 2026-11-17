import { HttpsError } from "firebase-functions/v2/https";
import { REGION } from "../config";
import type { Clock } from "../domain/clock";

export interface HelloDeps {
  clock: Clock;
}

export interface HelloResponse {
  message: string;
  region: string;
  serverTime: string; // ISO 8601
}

const MAX_NAME_LENGTH = 50;

export function handleHello(data: unknown, deps: HelloDeps): HelloResponse {
  const name = parseName(data);
  return {
    message: name ? `Hei, ${name}!` : "Hei fra Innhopp!",
    region: REGION,
    serverTime: deps.clock.now().toISOString(),
  };
}

function parseName(data: unknown): string | undefined {
  if (data === null || data === undefined) return undefined;
  if (typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Forventet et objekt.");
  }
  const name = (data as { name?: unknown }).name;
  if (name === undefined) return undefined;
  if (typeof name !== "string" || name.trim() === "" || name.length > MAX_NAME_LENGTH) {
    throw new HttpsError("invalid-argument", `name må være tekst på 1 til ${MAX_NAME_LENGTH} tegn.`);
  }
  return name.trim();
}