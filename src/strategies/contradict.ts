import { Theorem } from '../theorems';

export interface Insight {
  strategy: string;
  theorem: Theorem;
  content: string;
  timestamp?: number;
}

/**
 * CONTRADICT strategy: produce insights about when the theorem fails,
 * counterexamples, boundary cases where it gives wrong answers,
 * and assumptions that do not hold in real fleets.
 */
export function generateContradictInsight(theorem: Theorem): Insight {
  const parts: string[] = [];

  // Laman rigidity contradictions
  if (theorem.id === 'laman_rigidity') {
    parts.push('COUNTEREXAMPLE: A complete graph on 4 vertices (K4) has E=6, V=4. E = 2V-3 = 5, so 6 > 5. K4 satisfies E >= 2V-3 but is not generically rigid in 2D - it is actually flexible (has internal degrees of freedom). The theorem requires E = 2V-3 exactly, not just >=.');
    parts.push('FAILS WHEN: The graph is not generically positioned - e.g., if all vertices happen to lie on a circle, the rigidity properties change. Laman theorem is about generic position, not arbitrary position.');
    parts.push('REAL FLEET ASSUMPTION VIOLATED: Agents move continuously. But Laman assumes fixed vertex positions. In a dynamic fleet where vertices (agents) can move, the rigidity condition must be constantly re-checked.');
    parts.push('FAILS WHEN: The 2D assumption is violated. If agents operate in 3D space, Laman condition is neither necessary nor sufficient. The fleet physical space must be truly 2D for this theorem to apply.');
  }

  // H1 emergence contradictions
  if (theorem.id === 'h1_emergence') {
    parts.push('COUNTEREXAMPLE: A graph with multiple connected components (C > 1). beta_1 = E - V + C. For C=2 with V=4, E=5: beta_1 = 5-4+2 = 3. V-2 = 2. Emergence claimed (3 > 2), but the two components might each be rigid subgraphs with no cross-component cycles.');
    parts.push('FAILS WHEN: The theorem assumes a single component where the threshold V-2 makes sense. With C > 1, the rigidity threshold becomes unclear - each component has its own threshold.');
    parts.push('REAL FLEET ASSUMPTION VIOLATED: beta_1 > V-2 does not mean emergence is observed immediately. Emergence requires cycles to actually interact. A fleet could have high beta_1 but no cross-cycle interactions, showing no emergent behavior.');
    parts.push('FAILS WHEN: Edge weights are not uniform. The theorem treats all edges equally, but trust edges with different weights contribute differently to emergence. beta_1 counts edges, not weighted trust strength.');
  }

  // ZHC holonomy contradictions
  if (theorem.id === 'zhc_holonomy') {
    parts.push('FAILS WHEN: The connection is not flat. ZHC explicitly requires a flat connection. If agents report trust based on historical data (path-dependent), the connection may have curvature, and the loop product will not be identity.');
    parts.push('COUNTEREXAMPLE: A fleet with one Byzantine agent that deliberately falsifies its trust reports. The ZHC condition is stated for honest agents. With active adversarial behavior, loop_residual != 0 is possible and even likely.');
    parts.push('REAL FLEET ASSUMPTION VIOLATED: The theorem assumes agents update simultaneously. In an async fleet where different agents update at different times, the loop in the cycle may not close because edges change mid-traversal.');
    parts.push('NUMERICAL FAILURE: With many agents, accumulated floating-point errors around a 20+ edge cycle will produce non-zero loop_residual even when the true value is zero. The theorem is exact but implementations are not.');
  }

  // Pythagorean48 contradictions
  if (theorem.id === 'pythagorean48') {
    parts.push('FAILS WHEN: Trust differences must be distinguished at resolution finer than 7.5 degrees. If the fleet needs to distinguish between 3 degree and 5 degree trust differences, 48 directions are insufficient.');
    parts.push('COUNTEREXAMPLE: The 6 bits + rounding comment suggests 64 directions (6 bits) but we only have 48. Rounding loss of 0.415 bits means information is discarded. Over many hops, this loss compounds.');
    parts.push('REAL FLEET ASSUMPTION VIOLATED: 48 directions are fixed and uniform. But trust is not uniform - it may cluster around certain values (e.g., high trust among stable agents, low trust among new agents). Fixed buckets may not capture the actual distribution.');
    parts.push('FAILS WHEN: The 48 directions must be interpretable by all agents identically. If different agents have different up vectors (different coordinate systems), the encoding will not be consistent fleet-wide.');
  }

  // Trust convergence contradictions
  if (theorem.id === 'trust_convergence') {
    parts.push('FAILS WHEN: The fleet is not Laman-rigid. If even one agent joins or leaves, changing E and V, the rigidity condition may be violated and convergence is not guaranteed.');
    parts.push('FAILS WHEN: Not all trust edges satisfy ZHC flatness. If even one edge has non-zero holonomy (e.g., a Byzantine agent reporting inflated trust), the flatness condition is violated.');
    parts.push('COUNTEREXAMPLE: A fleet with two disconnected clusters (C=2). Each cluster might converge to different trust equilibria. The theorem says unique equilibrium but that is only for a connected graph.');
    parts.push('REAL FLEET ASSUMPTION VIOLATED: Convergence assumes agents update continuously. If agents go offline, update rarely, or have very different update frequencies, the actual convergence may take infinite time or never complete.');
  }

  return {
    strategy: 'CONTRADICT',
    theorem,
    content: parts.join(' '),
  };
}