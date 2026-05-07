import { Theorem } from '../theorems';

export interface Insight {
  strategy: string;
  theorem: Theorem;
  content: string;
  timestamp?: number;
}

/**
 * EXPLORE strategy: produce insights about non-obvious implications,
 * boundary conditions, and what the theorem says nothing about.
 */
export function generateExploreInsight(theorem: Theorem): Insight {
  const parts: string[] = [];

  // Boundary cases for Laman rigidity
  if (theorem.id === 'laman_rigidity') {
    parts.push('BOUNDARY: E = 2V - 4 (just under-rigid). One edge short means exactly one agent pair is under-constrained - they can drift relative to the rest of the fleet without breaking the graph structure. The rigidity threshold is sharp.');
    parts.push('BOUNDARY: E = 2V - 2 (just over-rigid). One extra edge means the graph has redundant constraints. This could mean either: (a) the extra edge is unnecessary and can be removed without losing rigidity, or (b) the graph has internal stress that could cause instability under perturbation.');
    parts.push('SILENT: The theorem says nothing about 3D rigidity. In 3D, generic rigidity requires E = 3V - 6, and the Laman condition is neither necessary nor sufficient. A fleet operating in 3D coordinate space (e.g., drones with altitude) would need a completely different rigidity theory.');
    parts.push('SILENT: The theorem assumes generic position - no three vertices collinear, no special degeneracies. In a real fleet where agents report discrete GPS coordinates, this assumption may not hold.');
  }

  // H1 emergence boundary cases
  if (theorem.id === 'h1_emergence') {
    parts.push('BOUNDARY: When beta_1 = V - 2 exactly (C=1), the system sits at the rigidity threshold. Small perturbations in edge weights could push it into emergence or keep it rigid. This is a critical point.');
    parts.push('SILENT: The theorem does not say how fast emergence develops once beta_1 > V - 2. It could be instantaneous or could require many cycles.');
    parts.push('SILENT: The theorem treats C as static, but in a real fleet, agents join/leave, changing C. What happens to beta_1 during a fleet reconfiguration?');
  }

  // ZHC holonomy boundary cases
  if (theorem.id === 'zhc_holonomy') {
    parts.push('BOUNDARY: The theorem assumes exact flatness. In practice, floating-point errors accumulate around long cycles. When does loop_residual become non-zero due to numerical precision rather than actual holonomy?');
    parts.push('SILENT: The theorem does not bound how many edges a cycle can have before numerical error dominates. Long cycles in large fleets may never close exactly.');
    parts.push('SILENT: What happens when Byzantine agents deliberately falsify their reported holonomy? The theorem assumes honest reporting.');
  }

  // Pythagorean48 boundary cases
  if (theorem.id === 'pythagorean48') {
    parts.push('BOUNDARY: 48 directions means 7.5 degree resolution. Two agents 4 degrees apart in trust space will round to the same bucket. Is 7.5 degrees fine enough for the trust distinctions a fleet actually needs to make?');
    parts.push('SILENT: The theorem does not specify the origin of the 48 directions. Are they uniformly spaced? Based on some anchor orientation? This matters for how trust vectors align across cycles.');
    parts.push('SILENT: With 5.585 bits per vector, there are ~0.415 bits lost per direction to rounding. Over many hops, does this rounding error accumulate?');
  }

  // Trust convergence boundary cases
  if (theorem.id === 'trust_convergence') {
    parts.push('BOUNDARY: The theorem guarantees existence of unique equilibrium but not speed of convergence. Could take 1 iteration or 10,000.');
    parts.push('SILENT: What happens if the fleet topology changes mid-convergence? Does the equilibrium persist or must trust values re-converge?');
    parts.push('SILENT: The theorem assumes flat trust edges - no cycles with non-zero holonomy. But if a single edge becomes non-flat (e.g., a Byzantine agent), does the entire convergence guarantee collapse?');
  }

  return {
    strategy: 'EXPLORE',
    theorem,
    content: parts.join(' '),
  };
}