import { Theorem } from '../theorems';
import { Insight } from '../strategies';
import { computeNovelty } from './novelty';
import { computeCorrectness } from './correctness';
import { computeCompleteness } from './depth';
import { computeDepthScore } from './depth';

export { computeNovelty } from './novelty';
export { computeCorrectness } from './correctness';
export { computeCompleteness } from './depth';

export interface QualityScore {
  novelty: number;
  correctness: number;
  completeness: number;
  depth: number;
  overall: number;
}

/**
 * Compute overall quality score for an insight
 * Novelty × Correctness × Completeness × Depth
 * Threshold: 0.35 to pass
 */
export function computeQuality(insight: Insight, theorem: Theorem): QualityScore {
  const novelty = computeNovelty(insight, theorem);
  const correctness = computeCorrectness(insight, theorem);
  const completeness = computeCompleteness(insight, theorem);
  const depth = computeDepthScore(insight, theorem);
  
  const overall = novelty * correctness * completeness * depth;
  
  return {
    novelty,
    correctness,
    completeness,
    depth,
    overall,
  };
}

/**
 * Check if insight passes quality threshold
 */
export function passesThreshold(quality: QualityScore, threshold: number = 0.35): boolean {
  return quality.overall >= threshold;
}