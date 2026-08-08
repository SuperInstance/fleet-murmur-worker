import { describe, it, expect } from 'vitest';
import { computeQuality, passesThreshold, QualityScore } from '../src/quality';
import { Theorem } from '../src/theorems';
import { Insight } from '../src/strategies';
import { THEOREMS } from '../src/theorems';

function makeInsight(strategy: string, theorem: Theorem, content: string): Insight {
  return { strategy, theorem, content, timestamp: Date.now() };
}

const laman = THEOREMS.find(t => t.id === 'laman_rigidity')!;
const h1 = THEOREMS.find(t => t.id === 'h1_emergence')!;
const zhc = THEOREMS.find(t => t.id === 'zhc_holonomy')!;
const trust = THEOREMS.find(t => t.id === 'trust_convergence')!;

describe('computeQuality', () => {
  it('returns all score components', () => {
    const insight = makeInsight('EXPLORE', laman, 'Testing boundary conditions: when E = 2V - 4 the graph is underconstrained.');
    const q = computeQuality(insight, laman);
    
    expect(q).toHaveProperty('novelty');
    expect(q).toHaveProperty('correctness');
    expect(q).toHaveProperty('completeness');
    expect(q).toHaveProperty('depth');
    expect(q).toHaveProperty('overall');
    expect(typeof q.overall).toBe('number');
  });

  it('overall is product of components', () => {
    const insight = makeInsight('EXPLORE', laman, 'Boundary case exploration.');
    const q = computeQuality(insight, laman);
    
    expect(q.overall).toBeCloseTo(q.novelty * q.correctness * q.completeness * q.depth, 5);
  });

  it('scores are in [0, 1] range', () => {
    const insight = makeInsight('EXPLORE', laman, 'a');
    const q = computeQuality(insight, laman);
    
    expect(q.novelty).toBeGreaterThanOrEqual(0);
    expect(q.novelty).toBeLessThanOrEqual(1);
    expect(q.correctness).toBeGreaterThanOrEqual(0);
    expect(q.correctness).toBeLessThanOrEqual(1);
    expect(q.completeness).toBeGreaterThanOrEqual(0);
    expect(q.completeness).toBeLessThanOrEqual(1);
    expect(q.depth).toBeGreaterThanOrEqual(0);
    expect(q.depth).toBeLessThanOrEqual(1);
  });
});

describe('computeNovelty', () => {
  it('penalizes pure restatement', () => {
    const formal = laman.formal.toLowerCase();
    const restatement = makeInsight('EXPLORE', laman, `The theorem states: ${laman.formal}. It follows that ${laman.formal}.`);
    const q = computeQuality(restatement, laman);
    
    expect(q.novelty).toBeLessThan(0.4);
  });

  it('rewards high-novelty markers', () => {
    const insight = makeInsight('EXPLORE', laman, 'However, surprisingly, this counterexample fails when boundary conditions are violated. Non-obvious hidden connection.');
    const q = computeQuality(insight, laman);
    
    expect(q.novelty).toBeGreaterThan(0.5);
  });

  it('rewards CONTRADICT strategy with counterexample markers', () => {
    const insight = makeInsight('CONTRADICT', laman, 'COUNTEREXAMPLE: fails when the graph has a leaf node.');
    const q = computeQuality(insight, laman);
    
    expect(q.novelty).toBeGreaterThan(0.5);
  });

  it('rewards CONNECT strategy with unification markers', () => {
    const insight = makeInsight('CONNECT', laman, 'This connects to H1 emergence. → UNIFYING principle shared.');
    const q = computeQuality(insight, laman);
    
    expect(q.novelty).toBeGreaterThan(0.5);
  });
});

describe('computeCorrectness', () => {
  it('starts with high base score', () => {
    const insight = makeInsight('EXPLORE', laman, 'Standard exploration with no special markers.');
    const q = computeQuality(insight, laman);
    
    expect(q.correctness).toBeGreaterThan(0.7);
  });

  it('penalizes contradictory statements', () => {
    const insight = makeInsight('EXPLORE', laman, 'This is always true and never true at the same time.');
    const q = computeQuality(insight, laman);
    
    expect(q.correctness).toBeLessThan(0.85);
  });

  it('penalizes vague hedging', () => {
    const insight = makeInsight('EXPLORE', laman, 'This might be correct. It could be wrong.');
    const q = computeQuality(insight, laman);
    
    expect(q.correctness).toBeLessThan(0.85);
  });

  it('rewards correct H1 formula mention', () => {
    const insight = makeInsight('EXPLORE', h1, 'The formula β₁ = E - V + C correctly identifies the first Betti number.');
    const q = computeQuality(insight, h1);
    
    expect(q.correctness).toBeGreaterThan(0.85);
  });

  it('rewards trust convergence with both Laman and ZHC', () => {
    const insight = makeInsight('CONNECT', trust, 'Convergence requires both Laman rigidity and ZHC holonomy conditions to hold.');
    const q = computeQuality(insight, trust);
    
    expect(q.correctness).toBeGreaterThan(0.9);
  });
});

describe('computeCompleteness', () => {
  it('rewards EXPLORE with boundary conditions', () => {
    const insight = makeInsight('EXPLORE', laman, 'Boundary case: when E = 2V - 4, the graph is not rigid. The theorem says nothing about 3D. Assumption: 2D only.');
    const q = computeQuality(insight, laman);
    
    expect(q.completeness).toBeGreaterThan(0.7);
  });

  it('rewards CONNECT with multiple theorem references', () => {
    const insight = makeInsight('CONNECT', laman, 'Laman connects to H1 emergence and ZHC holonomy. Both share the same combinatorial structure. Unifying principle.');
    const q = computeQuality(insight, laman);
    
    expect(q.completeness).toBeGreaterThan(0.7);
  });

  it('rewards CONTRADICT with counterexample', () => {
    const insight = makeInsight('CONTRADICT', laman, 'COUNTEREXAMPLE: real fleet has actual graphs that violate the condition. Fails when graph has floating vertices.');
    const q = computeQuality(insight, laman);
    
    expect(q.completeness).toBeGreaterThan(0.7);
  });

  it('rewards QUESTION with open questions', () => {
    const insight = makeInsight('QUESTION', laman, 'OPEN: What happens in 3D? WRONG IF: graph is disconnected. RESEARCH: extension to dynamic graphs.');
    const q = computeQuality(insight, laman);
    
    expect(q.completeness).toBeGreaterThan(0.7);
  });

  it('penalizes very short content', () => {
    const insight = makeInsight('EXPLORE', laman, 'ok');
    const q = computeQuality(insight, laman);
    
    expect(q.completeness).toBeLessThan(0.6);
  });

  it('slightly rewards long content', () => {
    const longContent = 'This is a thorough exploration. '.repeat(30) + ' Boundary conditions analyzed.';
    const insight = makeInsight('EXPLORE', laman, longContent);
    const q = computeQuality(insight, laman);
    
    expect(q.completeness).toBeGreaterThan(0.5);
  });
});

describe('computeDepthScore', () => {
  it('rewards non-obvious markers', () => {
    const insight = makeInsight('EXPLORE', laman, 'However, surprisingly, this is counterintuitive. The hidden topology is subtle and implicitly emergent.');
    const q = computeQuality(insight, laman);
    
    expect(q.depth).toBeGreaterThan(0.6);
  });

  it('rewards mathematical depth markers', () => {
    const insight = makeInsight('EXPLORE', laman, 'This is a necessary and sufficient condition. Iff convergence at equilibrium. Topology matters.');
    const q = computeQuality(insight, laman);
    
    expect(q.depth).toBeGreaterThan(0.5);
  });

  it('rewards QUESTION strategy with open questions', () => {
    const insight = makeInsight('QUESTION', laman, 'OPEN: question one. OPEN: question two. RESEARCH: direction one.');
    const q = computeQuality(insight, laman);
    
    expect(q.depth).toBeGreaterThan(0.5);
  });
});

describe('passesThreshold', () => {
  it('passes when overall >= threshold', () => {
    const quality: QualityScore = { novelty: 1, correctness: 1, completeness: 1, depth: 1, overall: 1 };
    expect(passesThreshold(quality, 0.35)).toBe(true);
  });

  it('fails when overall < threshold', () => {
    const quality: QualityScore = { novelty: 0, correctness: 0, completeness: 0, depth: 0, overall: 0 };
    expect(passesThreshold(quality, 0.35)).toBe(false);
  });

  it('uses default threshold of 0.35', () => {
    const quality: QualityScore = { novelty: 0.5, correctness: 0.5, completeness: 0.5, depth: 0.5, overall: 0.0625 };
    expect(passesThreshold(quality)).toBe(false);
    
    const quality2: QualityScore = { novelty: 0.8, correctness: 0.8, completeness: 0.8, depth: 0.8, overall: 0.4096 };
    expect(passesThreshold(quality2)).toBe(true);
  });

  it('accepts custom threshold', () => {
    const quality: QualityScore = { novelty: 0.5, correctness: 0.5, completeness: 0.5, depth: 0.5, overall: 0.0625 };
    expect(passesThreshold(quality, 0.05)).toBe(true);
    expect(passesThreshold(quality, 0.1)).toBe(false);
  });
});

describe('Integration with real theorems', () => {
  it('all 5 theorems exist in the theorem set', () => {
    expect(laman).toBeDefined();
    expect(h1).toBeDefined();
    expect(zhc).toBeDefined();
    expect(trust).toBeDefined();
  });

  it('quality computation works for each theorem', () => {
    for (const theorem of THEOREMS) {
      const insight = makeInsight('EXPLORE', theorem, 'Boundary case analysis with however surprising depth markers.');
      const q = computeQuality(insight, theorem);
      expect(q.overall).toBeGreaterThanOrEqual(0);
      expect(q.overall).toBeLessThanOrEqual(1);
    }
  });
});
