import { Theorem } from '../theorems';
import { Insight } from '../strategies';

export interface QualityScore {
  novelty: number;
  correctness: number;
  completeness: number;
  depth: number;
  overall: number;
}

/**
 * Novelty: how original/insightful is this content?
 * 
 * Low novelty: restates the formal statement
 * Medium novelty: explores implications
 * High novelty: makes cross-connections, boundary case insights
 */
export function computeNovelty(insight: Insight, theorem: Theorem): number {
  const content = insight.content.toLowerCase();
  const formal = theorem.formal.toLowerCase();
  
  // Check if it's just a restatement
  const formalTerms = formal.split(/[\s\W]+/).filter(t => t.length > 3);
  const restatementCount = formalTerms.filter(term => content.includes(term)).length;
  const restatementRatio = restatementCount / formalTerms.length;
  
  if (restatementRatio > 0.7) {
    return 0.15; // Just restating
  }
  
  // High novelty markers
  const highNoveltyMarkers = [
    'boundary', 'counterexample', 'fails when', 'contradicts',
    'non-obvious', 'hidden', 'assumes', 'violated', 'different',
    'connects to', 'unifies', 'despite', 'however', 'but',
  ];
  
  const lowNoveltyMarkers = [
    'therefore', 'thus', 'hence', 'so', 'this means',
    'the theorem states', 'it follows',
  ];
  
  let score = 0.4; // Base
  
  const contentLower = insight.content.toLowerCase();
  
  for (const marker of highNoveltyMarkers) {
    if (contentLower.includes(marker)) score += 0.08;
  }
  
  for (const marker of lowNoveltyMarkers) {
    if (contentLower.includes(marker)) score -= 0.05;
  }
  
  // Strategy-specific adjustments
  if (insight.strategy === 'EXPLORE') {
    if (content.includes('E = 2V - 4') || content.includes('E = 2V - 2')) {
      score += 0.15; // Boundary case exploration
    }
    if (content.includes('says nothing about')) {
      score += 0.1; // Identified gaps
    }
  }
  
  if (insight.strategy === 'CONNECT') {
    if (content.includes('→') || content.includes('UNIFYING')) {
      score += 0.15; // Cross-theorem connections
    }
  }
  
  if (insight.strategy === 'CONTRADICT') {
    if (content.includes('COUNTEREXAMPLE') || content.includes('FAILS WHEN')) {
      score += 0.15; // Identified failure modes
    }
  }
  
  if (insight.strategy === 'QUESTION') {
    if (content.includes('OPEN:') || content.includes('RESEARCH:')) {
      score += 0.1; // Open questions
    }
  }
  
  return Math.min(1, Math.max(0, score));
}