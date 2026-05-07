import { Theorem, THEOREMS } from '../theorems';

export interface Insight {
  strategy: string;
  theorem: Theorem;
  content: string;
  timestamp?: number;
}

/**
 * SYNTHESIZE strategy: produce insights about the unifying principle,
 * what the theorem shares with all others, and the one sentence
 * that captures the fleet coordination truth.
 */
export function generateSynthesizeInsight(theorem: Theorem): Insight {
  const parts: string[] = [];

  // The core unifying principle across all theorems
  const unifyingSentence = 'Fleet coordination is constraint satisfaction on a rigidity graph: enough edges to eliminate degrees of freedom, flat connections so trust flows without drift, and discrete encoding so the fleet reaches a unique equilibrium.';

  parts.push('ONE SENTENCE: ' + unifyingSentence);

  // What this theorem shares with all others
  parts.push('SHARES WITH ALL: All five theorems concern the same underlying structure - a graph of agents connected by trust edges. Laman rigidity determines if the graph is stiff enough. H1 emergence counts the excess loops. ZHC flatness ensures those loops do not accumulate error. Pythagorean48 discretizes the trust values. Trust convergence guarantees the system settles.');
  parts.push('SHARES WITH ALL: The constraint satisfaction principle - the fleet must satisfy enough constraints (edges) to eliminate unwanted flexibility. Too few = under-constrained (drift). Too many = over-constrained (redundancy, possible conflicts).');
  parts.push('SHARES WITH ALL: The 2D assumption - all theorems assume a 2D fleet space. In higher dimensions, the mathematics changes fundamentally. The theorems are statements about planar graphs.');
  parts.push('SHARES WITH ALL: Discrete encoding - whether 48 directions or beta_1 counts, the theorems work with countable, discrete quantities. Continuous trust values get discretized for the theorems to apply.');
  parts.push('UNIFYING PRINCIPLE: The fleet is a constraint satisfaction network. Rigidity provides the structural constraints. Trust provides the constraint values. Emergence measures the excess capacity. Flatness ensures constraints compose correctly. Convergence shows the system stabilizes.');
  parts.push('UNIFYING PRINCIPLE: Every theorem can be restated as: "Given a graph with the right number of edges (Laman), counting the right quantity (beta_1), satisfying the right condition (ZHC), encoded the right way (48 dirs), the fleet reaches the right state (unique equilibrium)." The "right" = mathematical property that ensures fleet coordination.');

  // The fleet coordination truth
  parts.push('FLEET COORDINATION TRUTH: A fleet of agents coordinates reliably when (1) the trust graph is just-rigid (2V-3 edges), (2) trust around every cycle sums to zero (ZHC), (3) trust values are discretized to 48 directions, and (4) these conditions together force trust to converge to a unique value. Rigidity without flatness = drift. Flatness without rigidity = no structure. Both = coordination.');

  return {
    strategy: 'SYNTHESIZE',
    theorem,
    content: parts.join(' '),
  };
}