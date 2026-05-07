import { Theorem } from '../theorems';
import { Insight } from '../strategies';

/**
 * Completeness: does it address the theorem's core question?
 * EXPLORE → covers boundary conditions?
 * CONNECT → covers ≥2 connections?
 * SYNTHESIZE → unifies ≥2 theorems?
 * CONTRADICT → identifies failure modes?
 * QUESTION → identifies open questions?
 */
export function computeCompleteness(insight: Insight, theorem: Theorem): number {
  const content = insight.content;
  let score = 0.5; // Base
  
  switch (insight.strategy) {
    case 'EXPLORE': {
      // Should cover boundary conditions
      if (content.includes('E = 2V - 4') || content.includes('E = 2V - 2') ||
          content.includes('boundary') || content.includes('threshold')) {
        score += 0.2;
      }
      // Should mention what theorem says nothing about
      if (content.includes('says nothing') || content.includes('silent') ||
          content.includes('no mention')) {
        score += 0.15;
      }
      // Should cover assumptions
      if (content.includes('assumption') || content.includes('2D') ||
          content.includes('generic')) {
        score += 0.1;
      }
      break;
    }
    
    case 'CONNECT': {
      // Should connect to at least 2 other theorems
      const theoremMentions = ['laman', 'h1', 'emergence', 'zhc', 'holonomy', 
                               'pythagorean', 'trust convergence', 'trust_convergence'];
      const connectionsFound = theoremMentions.filter(t => 
        content.toLowerCase().includes(t)
      ).length;
      
      if (connectionsFound >= 2) score += 0.25;
      else if (connectionsFound === 1) score += 0.1;
      
      // Should mention unifying principle
      if (content.includes('unify') || content.includes('same') ||
          content.includes('shared') || content.includes('both')) {
        score += 0.15;
      }
      break;
    }
    
    case 'CONTRADICT': {
      // Should provide counterexamples
      if (content.includes('counterexample') || content.includes('COUNTEREXAMPLE')) {
        score += 0.2;
      }
      // Should mention failure conditions
      if (content.includes('fails when') || content.includes('FAILS WHEN') ||
          content.includes('violated') || content.includes('assumption')) {
        score += 0.15;
      }
      // Should mention real fleet violations
      if (content.includes('real fleet') || content.includes('actual')) {
        score += 0.1;
      }
      break;
    }
    
    case 'SYNTHESIZE': {
      // Should have one sentence
      if (content.includes('ONE SENTENCE') || content.includes('fleet coordination truth')) {
        score += 0.2;
      }
      // Should share with all theorems
      if (content.includes('shares with all') || content.includes('all theorems')) {
        score += 0.15;
      }
      // Should have unifying principle
      if (content.includes('unifying principle') || content.includes('UNIFYING')) {
        score += 0.15;
      }
      break;
    }
    
    case 'QUESTION': {
      // Should have open questions
      if (content.includes('OPEN:') || content.includes('open question')) {
        score += 0.2;
      }
      // Should have wrong if conditions
      if (content.includes('WRONG IF') || content.includes('wrong if')) {
        score += 0.15;
      }
      // Should have research directions
      if (content.includes('RESEARCH:') || content.includes('research')) {
        score += 0.1;
      }
      break;
    }
  }
  
  // General completeness: content length
  if (content.length > 500) score += 0.05;
  if (content.length < 100) score -= 0.1;
  
  return Math.min(1, Math.max(0, score));
}

/**
 * Depth: does it reveal something non-obvious? does it generate open questions?
 */
export function computeDepthScore(insight: Insight, theorem: Theorem): number {
  const content = insight.content;
  let score = 0.5; // Base
  
  // Non-obvious insights
  const nonObviousMarkers = [
    'however', 'but', 'despite', 'interestingly', 'surprising',
    'counterintuitive', 'unexpected', 'hidden', 'implicitly',
    'subtle', 'latent', 'emergent',
  ];
  
  for (const marker of nonObviousMarkers) {
    if (content.toLowerCase().includes(marker)) {
      score += 0.05;
    }
  }
  
  // Open questions generation (higher in QUESTION strategy)
  if (insight.strategy === 'QUESTION') {
    const openCount = (content.match(/OPEN:/gi) || []).length;
    const researchCount = (content.match(/RESEARCH:/gi) || []).length;
    score += Math.min(0.2, (openCount + researchCount) * 0.05);
  }
  
  // Specific mathematical depth markers
  const depthMarkers = [
    'necessary', 'sufficient', 'iff', 'implies',
    'sufficient condition', 'necessary condition',
    'convergence', 'equilibrium', 'topology',
  ];
  
  for (const marker of depthMarkers) {
    if (content.toLowerCase().includes(marker)) {
      score += 0.03;
    }
  }
  
  // Strategy-specific depth
  if (insight.strategy === 'SYNTHESIZE') {
    if (content.includes('unifying principle')) score += 0.15;
    if (content.includes('fleet coordination truth')) score += 0.1;
  }
  
  if (insight.strategy === 'CONTRADICT') {
    if (content.includes('COUNTEREXAMPLE')) score += 0.1;
  }
  
  return Math.min(1, Math.max(0, score));
}