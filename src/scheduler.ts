import { Theorem, THEOREMS } from './theorems';
import { Insight } from './strategies';

export interface SchedulerState {
  currentIndex: number;
  lastRunPerTheorem: Map<string, number>;
  insightsProduced: number;
  qualityPassRate: number;
  totalProduced: number;
  totalPassed: number;
}

export interface CycleResult {
  theorem: Theorem;
  insights: Insight[];
  passedCount: number;
  skipped: boolean;
  reason?: string;
}

/**
 * MurmurWorkerScheduler: orchestrates when to run each strategy cycle
 * 
 * Strategy:
 * - Each cycle: pick a theorem that hasn't been run recently
 * - Rotate theorems so all get covered over time
 * - Track statistics
 */
export class MurmurWorkerScheduler {
  private state: SchedulerState;
  private cycleIntervalMs: number;
  private lastQualityScore: number = 0;
  
  constructor(cycleIntervalMs: number = 30 * 60 * 1000) { // Default: 30 minutes
    this.cycleIntervalMs = cycleIntervalMs;
    this.state = {
      currentIndex: Math.floor(Math.random() * THEOREMS.length),
      lastRunPerTheorem: new Map(),
      insightsProduced: 0,
      qualityPassRate: 0,
      totalProduced: 0,
      totalPassed: 0,
    };
  }
  
  /**
   * Get the next theorem to process
   */
  getNextTheorem(): Theorem {
    // Find theorem that hasn't been run in the longest time
    let bestTheorem = THEOREMS[this.state.currentIndex];
    let oldestRun = Date.now();
    
    for (const theorem of THEOREMS) {
      const lastRun = this.state.lastRunPerTheorem.get(theorem.id) || 0;
      if (lastRun < oldestRun) {
        oldestRun = lastRun;
        bestTheorem = theorem;
      }
    }
    
    // Update index to point to this theorem
    this.state.currentIndex = THEOREMS.indexOf(bestTheorem);
    
    // Mark as run now
    this.state.lastRunPerTheorem.set(bestTheorem.id, Date.now());
    
    return bestTheorem;
  }
  
  /**
   * Record the results of a cycle
   */
  recordCycleResult(result: CycleResult): void {
    this.state.totalProduced += result.insights.length;
    this.state.totalPassed += result.passedCount;
    
    // Update pass rate (exponential moving average)
    if (result.insights.length > 0) {
      const cyclePassRate = result.passedCount / result.insights.length;
      const alpha = 0.1; // Smoothing factor
      this.state.qualityPassRate = this.state.qualityPassRate === 0
        ? cyclePassRate
        : alpha * cyclePassRate + (1 - alpha) * this.state.qualityPassRate;
    }
    
    // Update last run
    this.state.lastRunPerTheorem.set(result.theorem.id, Date.now());
  }
  
  /**
   * Get time until next cycle
   */
  getTimeUntilNextCycle(): number {
    return this.cycleIntervalMs;
  }
  
  /**
   * Get current state snapshot
   */
  getState(): {
    insightsProduced: number;
    qualityPassRate: number;
    theoremsCovered: number;
    totalProduced: number;
    totalPassed: number;
  } {
    return {
      insightsProduced: this.state.insightsProduced,
      qualityPassRate: this.state.qualityPassRate,
      theoremsCovered: this.state.lastRunPerTheorem.size,
      totalProduced: this.state.totalProduced,
      totalPassed: this.state.totalPassed,
    };
  }
  
  /**
   * Force a specific theorem (for testing or on-demand)
   */
  forceTheorem(theoremId: string): Theorem | null {
    const theorem = THEOREMS.find(t => t.id === theoremId);
    if (theorem) {
      this.state.lastRunPerTheorem.set(theorem.id, 0); // Force it to be next
      this.state.currentIndex = THEOREMS.indexOf(theorem);
    }
    return theorem || null;
  }
  
  /**
   * Get time since last run for each theorem
   */
  getTimeSinceLastRun(): Map<string, number> {
    const result = new Map<string, number>();
    const now = Date.now();
    for (const theorem of THEOREMS) {
      const lastRun = this.state.lastRunPerTheorem.get(theorem.id) || 0;
      result.set(theorem.id, now - lastRun);
    }
    return result;
  }
}