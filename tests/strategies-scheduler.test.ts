// Tests for Murmur Worker strategies and scheduler
import { describe, it, expect, beforeEach } from 'vitest';
import { THEOREMS, getTheoremById, getConnectedTheorems } from '../src/theorems';
import { runAllStrategies, runStrategy, STRATEGIES } from '../src/strategies';
import { generateContradictInsight } from '../src/strategies/contradict';
import { generateConnectInsight } from '../src/strategies/connect';
import { generateExploreInsight } from '../src/strategies/explore';
import { generateSynthesizeInsight } from '../src/strategies/synthesize';
import { generateQuestionInsight } from '../src/strategies/question';
import { MurmurWorkerScheduler } from '../src/scheduler';

// ── Theorems ─────────────────────────────────────────────────
describe('Theorems', () => {
  it('has 5 theorems', () => {
    expect(THEOREMS).toHaveLength(5);
  });

  it('all theorems have unique ids', () => {
    const ids = THEOREMS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all theorems have required fields', () => {
    for (const t of THEOREMS) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.statement).toBeTruthy();
      expect(t.formal).toBeTruthy();
      expect(t.implications.length).toBeGreaterThan(0);
      expect(t.connections.length).toBeGreaterThan(0);
    }
  });

  it('getTheoremById returns the theorem', () => {
    const t = getTheoremById('laman_rigidity');
    expect(t).toBeDefined();
    expect(t!.name).toBe('Laman Rigidity');
  });

  it('getTheoremById returns undefined for unknown id', () => {
    expect(getTheoremById('nonexistent')).toBeUndefined();
  });

  it('getConnectedTheorems returns connected theorems', () => {
    const t = getTheoremById('laman_rigidity')!;
    const connected = getConnectedTheorems(t);
    expect(connected.length).toBe(t.connections.length);
    expect(connected.every(c => c !== undefined)).toBe(true);
  });

  it('all connection references are valid theorem ids', () => {
    for (const t of THEOREMS) {
      for (const connId of t.connections) {
        expect(getTheoremById(connId)).toBeDefined();
      }
    }
  });
});

// ── Strategies ───────────────────────────────────────────────
describe('Strategies', () => {
  it('has 5 strategies', () => {
    expect(STRATEGIES).toHaveLength(5);
  });

  it('all strategy names are unique', () => {
    const names = STRATEGIES.map(s => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('runAllStrategies produces 5 insights for each theorem', () => {
    for (const theorem of THEOREMS) {
      const insights = runAllStrategies(theorem);
      expect(insights).toHaveLength(5);
      expect(insights.every(i => i.timestamp)).toBe(true);
    }
  });

  it('runStrategy returns insight by name', () => {
    const theorem = THEOREMS[0];
    const insight = runStrategy(theorem, 'CONTRADICT');
    expect(insight).not.toBeNull();
    expect(insight!.strategy).toBe('CONTRADICT');
  });

  it('runStrategy is case-insensitive', () => {
    const theorem = THEOREMS[0];
    const insight = runStrategy(theorem, 'explore');
    expect(insight).not.toBeNull();
    expect(insight!.strategy).toBe('EXPLORE');
  });

  it('runStrategy returns null for unknown strategy', () => {
    expect(runStrategy(THEOREMS[0], 'OBSERVE')).toBeNull();
  });

  it('every strategy produces non-empty content for every theorem', () => {
    for (const theorem of THEOREMS) {
      const insights = runAllStrategies(theorem);
      for (const insight of insights) {
        expect(insight.content.length).toBeGreaterThan(10);
      }
    }
  });
});

// ── Individual Strategy Output Validation ────────────────────
describe('CONTRADICT strategy', () => {
  it('produces contradiction insights', () => {
    const insight = generateContradictInsight(THEOREMS[0]);
    expect(insight.strategy).toBe('CONTRADICT');
    expect(insight.content).toContain('COUNTEREXAMPLE');
  });

  it('handles each theorem', () => {
    for (const theorem of THEOREMS) {
      const insight = generateContradictInsight(theorem);
      expect(insight.content.length).toBeGreaterThan(50);
    }
  });
});

describe('CONNECT strategy', () => {
  it('produces connection insights', () => {
    const insight = generateConnectInsight(THEOREMS[0]);
    expect(insight.strategy).toBe('CONNECT');
    expect(insight.content).toContain('->');
  });

  it('references other theorems', () => {
    const insight = generateConnectInsight(getTheoremById('h1_emergence')!);
    expect(insight.content).toContain('LAMAN');
  });
});

describe('EXPLORE strategy', () => {
  it('produces exploration insights', () => {
    const insight = generateExploreInsight(THEOREMS[0]);
    expect(insight.strategy).toBe('EXPLORE');
    expect(insight.content.length).toBeGreaterThan(20);
  });

  it('handles each theorem', () => {
    for (const theorem of THEOREMS) {
      const insight = generateExploreInsight(theorem);
      expect(insight).toBeDefined();
    }
  });
});

describe('SYNTHESIZE strategy', () => {
  it('produces synthesis insights', () => {
    const insight = generateSynthesizeInsight(THEOREMS[0]);
    expect(insight.strategy).toBe('SYNTHESIZE');
    expect(insight.content.length).toBeGreaterThan(20);
  });
});

describe('QUESTION strategy', () => {
  it('produces question insights', () => {
    const insight = generateQuestionInsight(THEOREMS[0]);
    expect(insight.strategy).toBe('QUESTION');
    expect(insight.content.length).toBeGreaterThan(20);
  });
});

// ── Scheduler ────────────────────────────────────────────────
describe('MurmurWorkerScheduler', () => {
  let scheduler: MurmurWorkerScheduler;

  beforeEach(() => {
    scheduler = new MurmurWorkerScheduler(1000);
  });

  it('initializes with correct defaults', () => {
    const state = scheduler.getState();
    expect(state.insightsProduced).toBe(0);
    expect(state.qualityPassRate).toBe(0);
    expect(state.theoremsCovered).toBe(0);
    expect(state.totalProduced).toBe(0);
    expect(state.totalPassed).toBe(0);
  });

  it('getNextTheorem returns a valid theorem', () => {
    const theorem = scheduler.getNextTheorem();
    expect(THEOREMS).toContain(theorem);
  });

  it('getNextTheorem rotates to least recently run', () => {
    // Run first theorem
    const first = scheduler.getNextTheorem();
    // Run it again should give a different theorem (since first is now most recent)
    const second = scheduler.getNextTheorem();
    expect(second.id).not.toBe(first.id);
  });

  it('covers all theorems over enough cycles', () => {
    const seen = new Set<string>();
    for (let i = 0; i < THEOREMS.length; i++) {
      const t = scheduler.getNextTheorem();
      seen.add(t.id);
    }
    expect(seen.size).toBe(THEOREMS.length);
  });

  it('recordCycleResult updates totals', () => {
    const theorem = THEOREMS[0];
    scheduler.recordCycleResult({
      theorem,
      insights: [
        { strategy: 'EXPLORE', theorem, content: 'test1' },
        { strategy: 'CONNECT', theorem, content: 'test2' },
      ],
      passedCount: 1,
      skipped: false,
    });

    const state = scheduler.getState();
    expect(state.totalProduced).toBe(2);
    expect(state.totalPassed).toBe(1);
  });

  it('recordCycleResult updates quality pass rate', () => {
    const theorem = THEOREMS[0];
    // First cycle: 1/2 pass = 50%
    scheduler.recordCycleResult({
      theorem,
      insights: [
        { strategy: 'EXPLORE', theorem, content: 'a' },
        { strategy: 'CONNECT', theorem, content: 'b' },
      ],
      passedCount: 1,
      skipped: false,
    });
    expect(scheduler.getState().qualityPassRate).toBe(0.5);

    // Second cycle: 2/2 pass = 100%. EMA with alpha=0.1: 0.1*1.0 + 0.9*0.5 = 0.55
    scheduler.recordCycleResult({
      theorem,
      insights: [
        { strategy: 'EXPLORE', theorem, content: 'c' },
        { strategy: 'CONNECT', theorem, content: 'd' },
      ],
      passedCount: 2,
      skipped: false,
    });
    expect(scheduler.getState().qualityPassRate).toBeCloseTo(0.55, 2);
  });

  it('recordCycleResult does not update pass rate for zero insights', () => {
    const theorem = THEOREMS[0];
    scheduler.recordCycleResult({
      theorem,
      insights: [],
      passedCount: 0,
      skipped: false,
    });
    expect(scheduler.getState().qualityPassRate).toBe(0);
  });

  it('getTimeUntilNextCycle returns the interval', () => {
    expect(scheduler.getTimeUntilNextCycle()).toBe(1000);
  });

  it('forceTheorem sets up the next theorem', () => {
    // First, run all theorems so they all have lastRun > 0
    for (let i = 0; i < THEOREMS.length; i++) {
      scheduler.getNextTheorem();
    }
    // Now force a specific one — sets its lastRun to 0 (oldest)
    const result = scheduler.forceTheorem('zhc_holonomy');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('zhc_holonomy');

    const next = scheduler.getNextTheorem();
    expect(next.id).toBe('zhc_holonomy');
  });

  it('forceTheorem returns null for unknown id', () => {
    expect(scheduler.forceTheorem('nonexistent')).toBeNull();
  });

  it('getTimeSinceLastRun returns times for all theorems', () => {
    scheduler.getNextTheorem(); // Run one
    const times = scheduler.getTimeSinceLastRun();
    expect(times.size).toBe(THEOREMS.length);

    // The one we just ran should have a small time
    const just = [...times.entries()].sort((a, b) => a[1] - b[1])[0];
    expect(just[1]).toBeLessThan(1000); // Less than 1 second ago
  });

  it('theoremsCovered increases as theorems are run', () => {
    expect(scheduler.getState().theoremsCovered).toBe(0);
    scheduler.getNextTheorem();
    // After getNextTheorem, lastRunPerTheorem has been updated
    // But theoremsCovered in getState reads lastRunPerTheorem.size
    // getNextTheorem sets lastRunPerTheorem, so it should be at least 1
    expect(scheduler.getState().theoremsCovered).toBeGreaterThanOrEqual(1);
  });

  it('handles skipped cycles', () => {
    const theorem = THEOREMS[0];
    scheduler.recordCycleResult({
      theorem,
      insights: [],
      passedCount: 0,
      skipped: true,
      reason: 'API unavailable',
    });
    // Skipped cycle with 0 insights should not affect pass rate
    expect(scheduler.getState().totalProduced).toBe(0);
    expect(scheduler.getState().totalPassed).toBe(0);
  });
});
