import { Theorem } from '../theorems';
import { generateExploreInsight } from './explore';
import { generateConnectInsight } from './connect';
import { generateContradictInsight } from './contradict';
import { generateSynthesizeInsight } from './synthesize';
import { generateQuestionInsight } from './question';

export interface Insight {
  strategy: string;
  theorem: Theorem;
  content: string;
  timestamp?: number;
}

export type StrategyGenerator = (theorem: Theorem) => Insight;

const STRATEGIES: { name: string; generator: StrategyGenerator }[] = [
  { name: 'EXPLORE', generator: generateExploreInsight },
  { name: 'CONNECT', generator: generateConnectInsight },
  { name: 'CONTRADICT', generator: generateContradictInsight },
  { name: 'SYNTHESIZE', generator: generateSynthesizeInsight },
  { name: 'QUESTION', generator: generateQuestionInsight },
];

/**
 * Run all 5 strategies on a single theorem.
 */
export function runAllStrategies(theorem: Theorem): Insight[] {
  return STRATEGIES.map(({ name, generator }) => {
    const insight = generator(theorem);
    return {
      ...insight,
      timestamp: Date.now(),
    };
  });
}

/**
 * Run a specific strategy by name.
 */
export function runStrategy(theorem: Theorem, strategyName: string): Insight | null {
  const strategy = STRATEGIES.find(s => s.name === strategyName.toUpperCase());
  if (!strategy) return null;
  return {
    ...strategy.generator(theorem),
    timestamp: Date.now(),
  };
}

export { STRATEGIES };