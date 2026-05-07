import { THEOREMS } from './theorems';
import { runAllStrategies, Insight } from './strategies';
import { computeQuality, QualityScore } from './quality';
import { PlatoWriter } from './plato/writer';
import { IdleDetector } from './idle_detector';
import { MurmurWorkerScheduler, CycleResult } from './scheduler';

const QUALITY_THRESHOLD = 0.35;

export interface MurmurWorkerConfig {
  cycleIntervalMs?: number;
  qualityThreshold?: number;
  platoUrl?: string;
  platoRoom?: string;
}

export class MurmurWorker {
  private scheduler: MurmurWorkerScheduler;
  private idleDetector: IdleDetector;
  private platoWriter: PlatoWriter;
  private qualityThreshold: number;
  private running: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  
  constructor(config: MurmurWorkerConfig = {}) {
    this.scheduler = new MurmurWorkerScheduler(config.cycleIntervalMs);
    this.idleDetector = new IdleDetector();
    this.platoWriter = new PlatoWriter(config.platoUrl, config.platoRoom);
    this.qualityThreshold = config.qualityThreshold ?? QUALITY_THRESHOLD;
  }
  
  /**
   * Run one cycle: pick theorem, generate insights, quality gate, write to PLATO
   */
  async runCycle(): Promise<CycleResult> {
    const theorem = this.scheduler.getNextTheorem();
    const insights = runAllStrategies(theorem);
    
    const result: CycleResult = {
      theorem,
      insights,
      passedCount: 0,
      skipped: false,
    };
    
    // Quality gate each insight
    for (const insight of insights) {
      const quality = computeQuality(insight, theorem);
      
      if (quality.overall >= this.qualityThreshold) {
        result.passedCount++;
        
        // Write to PLATO
        const written = await this.platoWriter.writeInsight(insight, quality);
        if (written) {
          this.idleDetector.recordInsight();
        }
      }
    }
    
    this.scheduler.recordCycleResult(result);
    return result;
  }
  
  /**
   * Start the worker loop
   */
  start(): void {
    if (this.running) {
      console.log('[MurmurWorker] Already running');
      return;
    }
    
    this.running = true;
    console.log('[MurmurWorker] Starting...');
    
    // Run immediately on start
    this.runOnce();
    
    // Then schedule periodic runs
    this.intervalHandle = setInterval(() => {
      this.runOnce();
    }, this.scheduler.getTimeUntilNextCycle());
  }
  
  /**
   * Run one iteration of the worker
   */
  private async runOnce(): Promise<void> {
    // Check idle conditions
    const { skip, reason } = this.idleDetector.shouldSkipWork();
    
    if (skip) {
      console.log(`[MurmurWorker] Skipping cycle: ${reason}`);
      return;
    }
    
    try {
      console.log(`[MurmurWorker] Running cycle at ${new Date().toISOString()}`);
      const result = await this.runCycle();
      
      console.log(
        `[MurmurWorker] Completed: ${result.insights.length} insights, ` +
        `${result.passedCount} passed (${result.theorem.name})`
      );
    } catch (error) {
      console.error(`[MurmurWorker] Cycle failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Stop the worker
   */
  stop(): void {
    this.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    console.log('[MurmurWorker] Stopped');
  }
  
  /**
   * Get worker status
   */
  getStatus(): {
    running: boolean;
    scheduler: ReturnType<MurmurWorkerScheduler['getState']>;
    idle: ReturnType<IdleDetector['shouldSkipWork']>;
  } {
    return {
      running: this.running,
      scheduler: this.scheduler.getState(),
      idle: this.idleDetector.shouldSkipWork(),
    };
  }
  
  /**
   * Force run a specific theorem (for testing)
   */
  async runTheorem(theoremId: string): Promise<CycleResult | null> {
    const theorem = THEOREMS.find(t => t.id === theoremId);
    if (!theorem) return null;
    
    const insights = runAllStrategies(theorem);
    let passedCount = 0;
    
    for (const insight of insights) {
      const quality = computeQuality(insight, theorem);
      if (quality.overall >= this.qualityThreshold) {
        passedCount++;
        await this.platoWriter.writeInsight(insight, quality);
      }
    }
    
    return { theorem, insights, passedCount, skipped: false };
  }
}

// Main entry point
if (require.main === module) {
  const worker = new MurmurWorker({
    cycleIntervalMs: 30 * 60 * 1000, // 30 minutes
    qualityThreshold: QUALITY_THRESHOLD,
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[MurmurWorker] Shutting down...');
    worker.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    worker.stop();
    process.exit(0);
  });
  
  // Start
  worker.start();
  
  // Log status periodically
  setInterval(() => {
    const status = worker.getStatus();
    console.log('[MurmurWorker] Status:', JSON.stringify(status.scheduler));
  }, 5 * 60 * 1000); // Every 5 minutes
}