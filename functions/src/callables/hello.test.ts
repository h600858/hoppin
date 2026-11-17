import { HttpsError } from "firebase-functions/v2/https";
import { describe, expect, it } from "vitest";
import { fixedClock } from "../domain/clock";
import { handleHello } from "./hello";

const deps = { clock: fixedClock(new Date("2026-11-17T06:40:00.000Z")) };

describe("handleHello", () => {
  it("greets by name and uses the injected clock", () => {
    expect(handleHello({ name: "Kari" }, deps)).toEqual({
      message: "Hei, Kari!",
      region: "europe-north1",
      serverTime: "2026-11-17T06:40:00.000Z",
    });
  });

  it("falls back to a default greeting without a name", () => {
    expect(handleHello(null, deps).message).toBe("Hei fra Innhopp!");
    expect(handleHello({}, deps).message).toBe("Hei fra Innhopp!");
  });

  it.each([42, "", "   ", "x".repeat(51)])("rejects invalid name %j", (name) => {
    expect(() => handleHello({ name }, deps)).toThrow(HttpsError);
  });

  it("rejects data that is not an object", () => {
    expect(() => handleHello("Kari", deps)).toThrow(HttpsError);
  });
});