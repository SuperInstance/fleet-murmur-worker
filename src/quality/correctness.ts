import { Theorem } from '../theorems';
import { Insight } from '../strategies';

/**
 * Correctness: is the math self-consistent and not contradicting the theorem?
 */
export function computeCorrectness(insight: Insight, theorem: Theorem): number {
  const content = insight.content;
  let score = 0.85; // Base - starts high
  
  // Check for common mathematical errors
  
  // Laman theorem specific checks
  if (theorem.id === 'laman_rigidity') {
    // Wrong: confusing necessary vs sufficient conditions
    if (content.includes('E >= 2V - 3') && !content.includes('exactly')) {
      // This could be a misstatement
      score -= 0.1;
    }
    // Correct: distinguishing E = 2V - 3 from >= or <=
    if (content.includes('E = 2V - 3') && content.includes('exactly')) {
      score += 0.05;
    }
  }
  
  // H1 emergence checks
  if (theorem.id === 'h1_emergence') {
    // Correct: mentions β₁ = E - V + C
    if (content.includes('β₁') && content.includes('E - V')) {
      score += 0.05;
    }
    // Correct: mentions emergence threshold
    if (content.includes('V - 2') || content.includes('rigidity threshold')) {
      score += 0.05;
    }
  }
  
  // ZHC holonomy checks
  if (theorem.id === 'zhc_holonomy') {
    // Correct: mentions loop product
    if (content.includes('holonomy') && content.includes('loop')) {
      score += 0.05;
    }
    // Correct: mentions flatness
    if (content.includes('flat') || content.includes('flatness')) {
      score += 0.05;
    }
  }
  
  // Pythagorean48 checks  
  if (theorem.id === 'pythagorean48') {
    // Correct: mentions 48 directions
    if (content.includes('48')) {
      score += 0.05;
    }
    // Correct: mentions bit count
    if (content.includes('5.585') || content.includes('bits')) {
      score += 0.05;
    }
  }
  
  // Trust convergence checks
  if (theorem.id === 'trust_convergence') {
    // Correct: mentions equilibrium
    if (content.includes('equilibrium') || content.includes('converge')) {
      score += 0.05;
    }
    // Correct: mentions Laman + ZHC preconditions
    if (content.includes('Laman') && content.includes('ZHC')) {
      score += 0.1; // Understanding both preconditions
    }
  }
  
  // Generic checks for all theorems
  // Check for contradictory statements
  const contradictions = [
    ['always', 'never'],
    ['must', 'cannot'],
    ['guaranteed', 'impossible'],
  ];
  
  for (const [a, b] of contradictions) {
    if (content.includes(a) && content.includes(b)) {
      score -= 0.1; // Potential contradiction
    }
  }
  
  // Check for vague hedging (slight negative)
  if (content.includes('might be') || content.includes('could be')) {
    score -= 0.05;
  }
  
  return Math.min(1, Math.max(0, score));
}