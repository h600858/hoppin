// Min-cost max-flow for the global assignment (plan 7.4, decisions/0008).
//
// The graph has four layers:
//
//   source ──(cap 1)──> candidate ──(cap 1, cost)──> shift ──(cap slots)──> sink
//
// The capacity of 1 on the candidate edge is what makes the offers
// disjoint: no candidate can carry more than one unit of flow, so no
// candidate gets more than one offer in a run.
//
// The algorithm is "successive shortest paths": repeatedly find the
// cheapest path from source to sink in the residual graph and push one unit
// along it. Each step keeps the flow the cheapest possible for its size, so
// when no path is left we have the largest possible flow, and the cheapest
// among the largest. Costs may be negative (urgency priority), so paths are
// found with Bellman-Ford (queue based), which handles negative edges. The
// original graph has no cycles, so there are no negative cycles.
//
// Everything is integers and edges are visited in insertion order, so the
// same problem always gives the same answer.

export interface AssignmentProblem {
  /** Number of candidates. Each can be assigned at most once. */
  candidateCount: number;
  /** Capacity per shift, how many candidates the shift can take. */
  shiftSlots: readonly number[];
  /** Allowed pairs with integer cost. Lower cost is better. */
  edges: readonly { candidate: number; shift: number; cost: number }[];
}

export interface Assignment {
  candidate: number;
  shift: number;
}

interface Edge {
  to: number;
  capacity: number;
  cost: number;
  /** Index of the reverse edge in edges[to]. */
  reverse: number;
}

class FlowGraph {
  readonly edges: Edge[][];

  constructor(nodeCount: number) {
    this.edges = Array.from({ length: nodeCount }, () => []);
  }

  /**
   * Adds an edge and its reverse edge (capacity 0, negated cost). The
   * reverse edge lets a later path undo flow, which is how the algorithm
   * moves a candidate from one shift to another when that is cheaper.
   */
  addEdge(from: number, to: number, capacity: number, cost: number): Edge {
    const forward: Edge = { to, capacity, cost, reverse: this.edges[to]!.length };
    const backward: Edge = { to: from, capacity: 0, cost: -cost, reverse: this.edges[from]!.length };
    this.edges[from]!.push(forward);
    this.edges[to]!.push(backward);
    return forward;
  }
}

/** Solves the assignment problem. Returns the pairs that carry flow, sorted. */
export function solveAssignment(problem: AssignmentProblem): Assignment[] {
  const { candidateCount, shiftSlots, edges } = problem;

  // Node numbers: source, candidates, shifts, sink.
  const source = 0;
  const candidateNode = (i: number) => 1 + i;
  const shiftNode = (j: number) => 1 + candidateCount + j;
  const sink = 1 + candidateCount + shiftSlots.length;
  const graph = new FlowGraph(sink + 1);

  for (let i = 0; i < candidateCount; i++) {
    graph.addEdge(source, candidateNode(i), 1, 0);
  }
  const pairEdges = edges.map((edge) => ({
    candidate: edge.candidate,
    shift: edge.shift,
    flowEdge: graph.addEdge(candidateNode(edge.candidate), shiftNode(edge.shift), 1, edge.cost),
  }));
  shiftSlots.forEach((slots, j) => {
    if (slots > 0) {
      graph.addEdge(shiftNode(j), sink, slots, 0);
    }
  });

  while (pushCheapestPath(graph, source, sink)) {
    // Each round sends one more candidate to a shift.
  }

  // A candidate → shift edge with no capacity left carries flow.
  return pairEdges
    .filter((pair) => pair.flowEdge.capacity === 0)
    .map(({ candidate, shift }) => ({ candidate, shift }))
    .sort((a, b) => a.candidate - b.candidate || a.shift - b.shift);
}

/**
 * Finds the cheapest source → sink path with free capacity and pushes one
 * unit along it. Returns false when no such path exists.
 */
function pushCheapestPath(graph: FlowGraph, source: number, sink: number): boolean {
  const nodeCount = graph.edges.length;
  const distance = new Array<number>(nodeCount).fill(Number.POSITIVE_INFINITY);
  const previousNode = new Array<number>(nodeCount).fill(-1);
  const previousEdge = new Array<number>(nodeCount).fill(-1);
  const inQueue = new Array<boolean>(nodeCount).fill(false);

  distance[source] = 0;
  const queue = [source];
  inQueue[source] = true;

  // Bellman-Ford with a queue: relax edges until no distance improves.
  while (queue.length > 0) {
    const node = queue.shift()!;
    inQueue[node] = false;
    graph.edges[node]!.forEach((edge, index) => {
      if (edge.capacity <= 0) {
        return;
      }
      const candidateDistance = distance[node]! + edge.cost;
      if (candidateDistance < distance[edge.to]!) {
        distance[edge.to] = candidateDistance;
        previousNode[edge.to] = node;
        previousEdge[edge.to] = index;
        if (!inQueue[edge.to]) {
          queue.push(edge.to);
          inQueue[edge.to] = true;
        }
      }
    });
  }

  if (distance[sink] === Number.POSITIVE_INFINITY) {
    return false;
  }

  // Walk back from the sink and move one unit of capacity onto the reverse edges.
  for (let node = sink; node !== source; node = previousNode[node]!) {
    const from = previousNode[node]!;
    const edge = graph.edges[from]![previousEdge[node]!]!;
    edge.capacity -= 1;
    graph.edges[node]![edge.reverse]!.capacity += 1;
  }
  return true;
}
