import { describe, expect, it } from "vitest";
import { config } from "../testing/matching_builders";
import { MatchingConfigError, assertValidConfig } from "./config";

describe("assertValidConfig", () => {
  it("accepts the Bjørkelia configuration", () => {
    expect(() => assertValidConfig(config())).not.toThrow();
  });

  it("rejects weights that do not sum to 1", () => {
    const broken = config();
    broken.weights.fairness = 0.3;
    expect(() => assertValidConfig(broken)).toThrow(MatchingConfigError);
  });

  it("tolerates floating point rounding in the sum", () => {
    const rounded = config();
    rounded.weights.proximity += 1e-9;
    expect(() => assertValidConfig(rounded)).not.toThrow();
  });

  it("rejects a wave table where a more urgent rule needs more time", () => {
    const broken = config();
    broken.waves.urgent.minMinutesBeforeStart = 200;
    expect(() => assertValidConfig(broken)).toThrow(/waves\.urgent/);
  });

  it("lists every problem at once", () => {
    const broken = config();
    broken.weights.fairness = 0.9;
    broken.waves.critical.minMinutesBeforeStart = 60;
    try {
      assertValidConfig(broken);
      expect.fail("should throw");
    } catch (error) {
      expect((error as MatchingConfigError).problems).toHaveLength(2);
    }
  });
});
