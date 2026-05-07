export interface Theorem {
  id: string;
  name: string;
  statement: string;
  formal: string;
  implications: string[];
  connections: string[];
}

export const THEOREMS: Theorem[] = [
  {
    id: 'laman_rigidity',
    name: 'Laman Rigidity',
    statement: 'A graph is generically rigid in 2D iff E = 2V - 3 and every subgraph satisfies the same condition.',
    formal: 'E = 2V - 3 ∧ ∀subgraphs: E_sub = 2V_sub - 3',
    implications: ['rigidity implies sparse enough', 'rigidity implies dense enough', '2D only assumption'],
    connections: ['h1_emergence', 'zhc_holonomy', 'pythagorean48'],
  },
  {
    id: 'h1_emergence',
    name: 'H¹ Emergence Detection',
    statement: 'β₁ = E - V + C. Emergence when β₁ exceeds the rigidity threshold (V-2 for C=1).',
    formal: 'β₁ = E - V + C; emergence ⟺ β₁ > V - 2',
    implications: ['cycles = constraint satisfaction paths', 'more cycles than rigid → emergence', 'C counts connected components'],
    connections: ['laman_rigidity', 'zhc_holonomy'],
  },
  {
    id: 'zhc_holonomy',
    name: 'Zero Holonomy Consensus',
    statement: 'For any cycle γ in a flat connection, the product of holonomy transformations around γ equals identity.',
    formal: '∏ᵧ holonomy(γ_i) = Id; loop_residual = 0',
    implications: ['trust converges across cycles', 'no drift after unlimited hops', 'any Byzantine tolerance'],
    connections: ['laman_rigidity', 'h1_emergence', 'trust_convergence'],
  },
  {
    id: 'pythagorean48',
    name: 'Pythagorean48 Trust Encoding',
    statement: '48 exact directions on the unit circle, log₂(48) = 5.585 bits per vector.',
    formal: 'directions = 48; bits_per_vector = log₂(48) ≈ 5.585',
    implications: ['discrete trust vectors', 'exactly 48 directions (not continuous)', '6 bits + rounding'],
    connections: ['zhc_holonomy', 'trust_convergence'],
  },
  {
    id: 'trust_convergence',
    name: 'Trust Convergence Theorem',
    statement: 'In a Laman-rigid fleet with trust edges satisfying the ZHC flatness condition, trust values converge to a unique equilibrium.',
    formal: '∀ flat trust edges on Laman-rigid graph → ∃! equilibrium',
    implications: ['unique trust equilibrium exists', 'convergence guaranteed by rigidity + ZHC', 'equilibrium is stable'],
    connections: ['laman_rigidity', 'zhc_holonomy', 'h1_emergence'],
  },
];

export function getTheoremById(id: string): Theorem | undefined {
  return THEOREMS.find(t => t.id === id);
}

export function getConnectedTheorems(theorem: Theorem): Theorem[] {
  return theorem.connections
    .map(id => getTheoremById(id))
    .filter((t): t is Theorem => t !== undefined);
}