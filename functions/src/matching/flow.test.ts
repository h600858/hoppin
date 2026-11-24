import { describe, expect, it } from "vitest";
import { type AssignmentProblem, solveAssignment } from "./flow";

// The flow solver on its own. The last test compares it with a brute force
// search over every possible assignment on many small random problems.

function totalCost(problem: AssignmentProblem, pairs: { candidate: number; shift: number }[]): number {
  return pairs.reduce((sum, pair) => {
    const edge = problem.edges.find((e) => e.candidate === pair.candidate && e.shift === pair.shift);
    return sum + edge!.cost;
  }, 0);
}

describe("solveAssignment", () => {
  it("gives each shift its cheapest candidate when there is no conflict", () => {
    const problem: AssignmentProblem = {
      candidateCount: 2,
      shiftSlots: [1, 1],
      edges: [
        { candidate: 0, shift: 0, cost: 10 },
        { candidate: 1, shift: 1, cost: 20 },
      ],
    };
    expect(solveAssignment(problem)).toEqual([
      { candidate: 0, shift: 0 },
      { candidate: 1, shift: 1 },
    ]);
  });

  it("never gives one candidate two shifts", () => {
    // Candidate 0 is best for both shifts, but can only take one.
    const problem: AssignmentProblem = {
      candidateCount: 2,
      shiftSlots: [1, 1],
      edges: [
        { candidate: 0, shift: 0, cost: 1 },
        { candidate: 0, shift: 1, cost: 1 },
        { candidate: 1, shift: 0, cost: 50 },
        { candidate: 1, shift: 1, cost: 50 },
      ],
    };
    const pairs = solveAssignment(problem);
    expect(pairs).toHaveLength(2);
    expect(new Set(pairs.map((p) => p.candidate)).size).toBe(2);
  });

  it("moves a candidate when that lets another shift be filled (the greedy trap)", () => {
    // Greedy shift by shift would give candidate 0 to shift 0 and leave
    // shift 1 empty. The flow gives shift 0 candidate 1 instead.
    const problem: AssignmentProblem = {
      candidateCount: 2,
      shiftSlots: [1, 1],
      edges: [
        { candidate: 0, shift: 0, cost: 1 },
        { candidate: 1, shift: 0, cost: 5 },
        { candidate: 0, shift: 1, cost: 2 },
      ],
    };
    expect(solveAssignment(problem)).toEqual([
      { candidate: 0, shift: 1 },
      { candidate: 1, shift: 0 },
    ]);
  });

  it("fills several slots on one shift", () => {
    const problem: AssignmentProblem = {
      candidateCount: 4,
      shiftSlots: [3],
      edges: [0, 1, 2, 3].map((candidate) => ({ candidate, shift: 0, cost: 10 * candidate })),
    };
    expect(solveAssignment(problem).map((p) => p.candidate)).toEqual([0, 1, 2]);
  });

  it("handles negative costs (urgency priority)", () => {
    // The urgent shift 1 has cost -100 and must win the only candidate.
    const problem: AssignmentProblem = {
      candidateCount: 1,
      shiftSlots: [1, 1],
      edges: [
        { candidate: 0, shift: 0, cost: 0 },
        { candidate: 0, shift: 1, cost: -100 },
      ],
    };
    expect(solveAssignment(problem)).toEqual([{ candidate: 0, shift: 1 }]);
  });

  it("returns nothing when no pair is allowed", () => {
    expect(solveAssignment({ candidateCount: 3, shiftSlots: [2], edges: [] })).toEqual([]);
  });

  it("matches brute force on 300 random small problems", () => {
    const random = seededRandom(20261124);
    for (let round = 0; round < 300; round++) {
      const problem = randomProblem(random);
      const pairs = solveAssignment(problem);
      const best = bruteForce(problem);

      expect(pairs.length, `round ${round}: size`).toBe(best.size);
      expect(totalCost(problem, pairs), `round ${round}: cost`).toBe(best.cost);
      expect(new Set(pairs.map((p) => p.candidate)).size).toBe(pairs.length);
      problem.shiftSlots.forEach((slots, shift) => {
        expect(pairs.filter((p) => p.shift === shift).length).toBeLessThanOrEqual(slots);
      });
    }
  });
});

/** Deterministic pseudo random numbers (mulberry32), so failures can be repeated. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomProblem(random: () => number): AssignmentProblem {
  const candidateCount = 1 + Math.floor(random() * 5);
  const shiftCount = 1 + Math.floor(random() * 3);
  const shiftSlots = Array.from({ length: shiftCount }, () => Math.floor(random() * 3));
  const edges: { candidate: number; shift: number; cost: number }[] = [];
  for (let candidate = 0; candidate < candidateCount; candidate++) {
    for (let shift = 0; shift < shiftCount; shift++) {
      if (random() < 0.7) {
        edges.push({ candidate, shift, cost: Math.floor(random() * 200) - 50 });
      }
    }
  }
  return { candidateCount, shiftSlots, edges };
}

/** Tries every assignment. Best means most pairs first, then lowest cost. */
function bruteForce(problem: AssignmentProblem): { size: number; cost: number } {
  const options = Array.from({ length: problem.candidateCount }, (_, candidate) =>
    problem.edges.filter((e) => e.candidate === candidate),
  );
  let best = { size: 0, cost: 0 };
  const used = problem.shiftSlots.map(() => 0);

  function visit(candidate: number, size: number, cost: number): void {
    if (candidate === problem.candidateCount) {
      if (size > best.size || (size === best.size && cost < best.cost)) {
        best = { size, cost };
      }
      return;
    }
    visit(candidate + 1, size, cost);
    for (const edge of options[candidate]!) {
      if (used[edge.shift]! < problem.shiftSlots[edge.shift]!) {
        used[edge.shift]! += 1;
        visit(candidate + 1, size + 1, cost + edge.cost);
        used[edge.shift]! -= 1;
      }
    }
  }

  visit(0, 0, 0);
  return best;
}
