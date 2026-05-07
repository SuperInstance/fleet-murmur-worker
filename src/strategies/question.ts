import { Theorem } from '../theorems';

export interface Insight {
  strategy: string;
  theorem: Theorem;
  content: string;
  timestamp?: number;
}

/**
 * QUESTION strategy: produce insights about open questions the theorem
 * does not answer, what would need to be true for the theorem to be wrong,
 * and research directions the theorem suggests.
 */
export function generateQuestionInsight(theorem: Theorem): Insight {
  const parts: string[] = [];

  // Laman rigidity open questions
  if (theorem.id === 'laman_rigidity') {
    parts.push('OPEN: How fast does rigidity emerge during fleet formation? Laman tells us the final state but not the dynamics. When exactly as edges are added, does rigidity appear suddenly or gradually?');
    parts.push('OPEN: What is the energy-minimizing configuration of a Laman-rigid fleet? The theorem says the graph is rigid but not what shape it takes. Multiple stable configurations may exist.');
    parts.push('WRONG IF: Generic position assumption fails. If agents cluster in non-generic configurations (e.g., all collinear), Laman condition no longer correctly predicts rigidity.');
    parts.push('WRONG IF: The fleet operates in a space with obstacles that constrain motion differently than open 2D. Laman assumes free 2D space.');
    parts.push('RESEARCH: Extend Laman rigidity to time-varying graphs where agents join/leave. How does rigidity change during fleet reconfiguration? Is there a smooth transition or a critical threshold?');
    parts.push('RESEARCH: What is the relationship between rigidity and consensus? If a graph is rigid, does it automatically reach consensus under any update rule, or are specific update rules required?');
  }

  // H1 emergence open questions
  if (theorem.id === 'h1_emergence') {
    parts.push('OPEN: How fast does emergence propagate? beta_1 > V-2 is a threshold but gives no timing information. Does emergence take one cycle or thousands?');
    parts.push('OPEN: Is there a maximum beta_1 beyond which emergence saturates? Can a fleet have too many cycles such that new emergent behaviors are suppressed by existing ones?');
    parts.push('WRONG IF: Cycles are not independent - if there are dependencies between cycles, beta_1 overcounts. In a graph with many overlapping cycles, beta_1 may not accurately reflect emergence potential.');
    parts.push('WRONG IF: Edge weights are not uniform. The theorem treats all edges equally, but in practice trust varies. Weighted beta_1 might be a better measure.');
    parts.push('RESEARCH: What is the spectrum of emergence - from weak (barely observable) to strong (dramatic new behavior)? beta_1 measures quantity, not quality of emergence.');
    parts.push('RESEARCH: How does emergence interact with the 48-direction encoding? Does discretization of trust values affect whether emergence is observable at the encoded resolution?');
  }

  // ZHC holonomy open questions
  if (theorem.id === 'zhc_holonomy') {
    parts.push('OPEN: What is the minimum cycle length at which numerical error dominates? For a fleet of N agents, what is the maximum cycle length before loop_residual becomes non-zero due to floating-point accumulation?');
    parts.push('OPEN: How does ZHC interact with Byzantine agents? What is the minimum fraction of Byzantine agents that can break the flatness condition?');
    parts.push('WRONG IF: The connection is not actually flat. If trust updates are path-dependent (historical), the connection has curvature. ZHC only holds for path-independent (flat) connections.');
    parts.push('WRONG IF: Agent clocks are not synchronized. If different agents have clocks that drift relative to each other, the simultaneous assumption of the loop product fails.');
    parts.push('RESEARCH: What happens to fleet coordination when loop_residual is small but non-zero? Is there a tolerance threshold? Does small non-zero holonomy cause slow drift or bounded oscillation?');
    parts.push('RESEARCH: Can ZHC be generalized to async fleets where agents update at different rates? The current formulation assumes synchronized updates.');
  }

  // Pythagorean48 open questions
  if (theorem.id === 'pythagorean48') {
    parts.push('OPEN: Why 48 specifically? Is this optimal, or just convenient? What is the minimum number of directions needed for fleet coordination?');
    parts.push('OPEN: How does the choice of 48 interact with Byzantine tolerance? If a Byzantine agent reports a trust value, how much does the 48-direction discretization help or hurt detection?');
    parts.push('WRONG IF: The 48 directions are not uniformly spaced. If they cluster around certain values, the encoding is biased.');
    parts.push('WRONG IF: Agents have different up directions (different local coordinate systems) and these are not calibrated. The encoding assumes a shared reference frame.');
    parts.push('RESEARCH: Optimal direction count as a function of fleet size. For larger fleets, are more directions needed? Is there a scaling law?');
    parts.push('RESEARCH: Can the encoding adapt dynamically? If trust is high-variance early in fleet formation and low-variance at steady state, should the number of directions change?');
  }

  // Trust convergence open questions
  if (theorem.id === 'trust_convergence') {
    parts.push('OPEN: What is the convergence rate? The theorem guarantees existence but not speed. Is it O(V) iterations? O(E)? Exponential?');
    parts.push('OPEN: Does the unique equilibrium depend on initial conditions? If agents start with different initial trust values, do they all converge to the same equilibrium regardless of starting point?');
    parts.push('WRONG IF: The fleet topology changes during convergence. If edges are added/removed mid-convergence, the guarantee may not hold.');
    parts.push('WRONG IF: Not all trust edges satisfy ZHC flatness. Even one non-flat edge could prevent convergence.');
    parts.push('RESEARCH: Partial convergence. If only 99% of trust edges converge, is that sufficient for fleet coordination? What threshold of partial convergence is acceptable?');
    parts.push('RESEARCH: What happens at the equilibrium? Does the theorem say anything about what the trust values actually are, or only that they converge to something unique?');
  }

  return {
    strategy: 'QUESTION',
    theorem,
    content: parts.join(' '),
  };
}