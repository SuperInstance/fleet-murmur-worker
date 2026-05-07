import { Theorem, getTheoremById, getConnectedTheorems } from '../theorems';

export interface Insight {
  strategy: string;
  theorem: Theorem;
  content: string;
  timestamp?: number;
}

/**
 * CONNECT strategy: produce insights about relationships between theorems,
 * shared structural elements, and what unifies them at the mathematical level.
 */
export function generateConnectInsight(theorem: Theorem): Insight {
  const parts: string[] = [];

  // Laman rigidity connections
  if (theorem.id === 'laman_rigidity') {
    parts.push('-> H1 EMERGENCE: Laman rigidity sets the threshold (V-2 cycles). H1 counts actual cycles. The gap beta_1 - (V-2) measures how far beyond rigidity the fleet is. Rigidity graph <-> cycle graph are the same structure, just viewed differently.');
    parts.push('-> ZHC HOLONOMY: A Laman-rigid graph has exactly enough edges to eliminate degrees of freedom. ZHC says those same edges, viewed as parallel transport, have zero total curvature. Rigidity = flatness of connection.');
    parts.push('-> PYTHAGOREAN48: Trust encoding needs enough directions to represent trust differences. But the number of directions also relates to the rigidity of the trust graph. More rigid = fewer redundant trust edges = cleaner encoding.');
    parts.push('UNIFYING: Both rigidity and emergence measure the same graph with different lenses - one asks "is it stiff?", the other asks "how many loops does it have?"');
  }

  // H1 emergence connections
  if (theorem.id === 'h1_emergence') {
    parts.push('-> LAMAN RIGIDITY: beta_1 = E - V + C. When C=1, rigidity threshold is V-2. Laman condition is exactly the boundary where beta_1 = V-2. Emergence is beta_1 exceeding that boundary.');
    parts.push('-> ZHC HOLONOMY: Each cycle in H1 is a closed loop in the fleet graph. ZHC says the holonomy around each such loop is identity. So the cycles counted by H1 are exactly the loops where holonomy must vanish.');
    parts.push('UNIFYING: beta_1 counts independent cycles. Each independent cycle is a constraint that must be satisfied (by ZHC). The excess cycles beyond rigidity are where new behavior can emerge - they are unconstrained by rigidity.');
  }

  // ZHC holonomy connections
  if (theorem.id === 'zhc_holonomy') {
    parts.push('-> LAMAN RIGIDITY: ZHC requires that for any cycle in the rigidity graph, the parallel transport around it sums to zero. Laman rigidity ensures these cycles exist and are well-defined.');
    parts.push('-> TRUST CONVERGENCE: ZHC flatness is the precondition for trust convergence. Without zero holonomy around cycles, trust values would drift indefinitely. ZHC is the geometric condition; convergence is the algebraic consequence.');
    parts.push('-> PYTHAGOREAN48: The 48-direction encoding must be coarse enough that round-trip accumulation lands on identity. If directions were finer, accumulated rounding might not close.');
    parts.push('UNIFYING: ZHC is the compatibility condition for a flat connection on the fleet bundle of trust values. Flatness = no curvature = trust is well-defined globally, not just locally.');
  }

  // Pythagorean48 connections
  if (theorem.id === 'pythagorean48') {
    parts.push('-> ZHC HOLONOMY: 48 directions means trust vectors live in Z_48. For ZHC to hold on this discrete space, the group of rotations must have order that divides 48. The fact that 48 is divisible by many small numbers makes it a good choice.');
    parts.push('-> TRUST CONVERGENCE: Convergence happens in the trust value space. With 48 discrete directions, equilibrium is reached when the trust vector stabilizes to one of 48 values.');
    parts.push('UNIFYING: Discrete directions = discrete trust space = finite group structure. The 48 directions form a cyclic group under composition. ZHC says trust around any cycle composes to identity in this group.');
  }

  // Trust convergence connections
  if (theorem.id === 'trust_convergence') {
    parts.push('-> LAMAN RIGIDITY: Rigidity gives the structural precondition. Without enough edges (2V-3), the fleet has flexibility and trust cannot converge to a unique point. Rigidity = structural precondition.');
    parts.push('-> ZHC HOLONOMY: ZHC flatness is the trust-specific precondition. Even in a rigid fleet, non-flat connections would cause drift. Flatness = geometric precondition for convergence.');
    parts.push('UNIFYING: Both rigidity and flatness are constraints on the same edge set. Rigidity constrains positions (2D geometry). ZHC constrains trust (direction vectors). Together they ensure the fleet reaches equilibrium in both geometry and trust.');
  }

  return {
    strategy: 'CONNECT',
    theorem,
    content: parts.join(' '),
  };
}