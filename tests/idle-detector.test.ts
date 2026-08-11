// Tests for idle_detector.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { IdleDetector, DEFAULT_IDLE_CONFIG } from '../src/idle_detector.js';

// ── Default Config ───────────────────────────────────────────
describe('DEFAULT_IDLE_CONFIG', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_IDLE_CONFIG.minBatteryPercent).toBeGreaterThan(0);
    expect(DEFAULT_IDLE_CONFIG.minBatteryPercent).toBeLessThan(50);
    expect(DEFAULT_IDLE_CONFIG.maxIdleMinutes).toBeGreaterThan(0);
    expect(DEFAULT_IDLE_CONFIG.maxTempCelsius).toBeGreaterThan(50);
    expect(DEFAULT_IDLE_CONFIG.maxInsightsPerHour).toBeGreaterThan(0);
  });
});

// ── IdleDetector — Insights Rate Limiting ────────────────────
describe('IdleDetector — Insights rate limiting', () => {
  let detector: IdleDetector;

  beforeEach(() => {
    detector = new IdleDetector({ maxInsightsPerHour: 3 });
  });

  it('allows work initially', () => {
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(false);
  });

  it('skips after max insights per hour', () => {
    // Prevent hourly reset by setting lastResetHour to current hour
    const currentHour = Math.floor(Date.now() / 3600000);
    (detector as any).lastResetHour = currentHour;
    detector.recordInsight();
    detector.recordInsight();
    detector.recordInsight();
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(true);
    expect(result.reason).toContain('insights');
  });

  it('does not skip before reaching max', () => {
    detector.recordInsight();
    detector.recordInsight();
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(false);
  });

  it('resets hourly counter', () => {
    // Prevent hourly reset during setup
    const currentHour = Math.floor(Date.now() / 3600000);
    (detector as any).lastResetHour = currentHour;
    detector.recordInsight();
    detector.recordInsight();
    detector.recordInsight();
    expect(detector.shouldSkipWork().skip).toBe(true);

    // Simulate time passing by setting lastResetHour to an old value
    (detector as any).lastResetHour = 0;
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(false);
  });

  it('records correct insight count', () => {
    expect((detector as any).insightsThisHour).toBe(0);
    detector.recordInsight();
    expect((detector as any).insightsThisHour).toBe(1);
    detector.recordInsight();
    expect((detector as any).insightsThisHour).toBe(2);
  });
});

// ── IdleDetector — Config Merging ────────────────────────────
describe('IdleDetector — Config merging', () => {
  it('merges partial config with defaults', () => {
    const detector = new IdleDetector({ maxInsightsPerHour: 10 });
    const config = (detector as any).config;
    expect(config.maxInsightsPerHour).toBe(10);
    expect(config.minBatteryPercent).toBe(DEFAULT_IDLE_CONFIG.minBatteryPercent);
    expect(config.maxTempCelsius).toBe(DEFAULT_IDLE_CONFIG.maxTempCelsius);
  });

  it('uses all defaults when no config provided', () => {
    const detector = new IdleDetector();
    const config = (detector as any).config;
    expect(config).toEqual(DEFAULT_IDLE_CONFIG);
  });

  it('overrides all defaults with full config', () => {
    const detector = new IdleDetector({
      minBatteryPercent: 30,
      maxIdleMinutes: 5,
      maxTempCelsius: 70,
      maxInsightsPerHour: 2,
    });
    const config = (detector as any).config;
    expect(config.minBatteryPercent).toBe(30);
    expect(config.maxIdleMinutes).toBe(5);
    expect(config.maxTempCelsius).toBe(70);
    expect(config.maxInsightsPerHour).toBe(2);
  });

  it('partial config keeps default for unspecified fields', () => {
    const detector = new IdleDetector({ maxTempCelsius: 65 });
    const config = (detector as any).config;
    expect(config.maxTempCelsius).toBe(65);
    expect(config.minBatteryPercent).toBe(DEFAULT_IDLE_CONFIG.minBatteryPercent);
    expect(config.maxIdleMinutes).toBe(DEFAULT_IDLE_CONFIG.maxIdleMinutes);
    expect(config.maxInsightsPerHour).toBe(DEFAULT_IDLE_CONFIG.maxInsightsPerHour);
  });
});

// ── IdleDetector — System checks (no mock, real system) ──────
describe('IdleDetector — System checks', () => {
  it('shouldSkipWork returns an object with skip and reason', () => {
    const detector = new IdleDetector({ maxInsightsPerHour: 999 });
    const result = detector.shouldSkipWork();
    expect(typeof result.skip).toBe('boolean');
    expect(typeof result.reason).toBe('string');
  });

  it('does not crash on headless system (no battery, no GUI)', () => {
    const detector = new IdleDetector({ maxInsightsPerHour: 999 });
    // In WSL/headless, battery/xprintidle may not exist — should not throw
    expect(() => detector.shouldSkipWork()).not.toThrow();
  });

  it('returns skip=false on a healthy headless system', () => {
    // WSL environment: no battery, no xprintidle, no thermal zones typically
    // The detector should return skip=false (proceed with work)
    const detector = new IdleDetector({
      maxInsightsPerHour: 999,
      minBatteryPercent: 0,
      maxTempCelsius: 200, // very high so it won't trigger
    });
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(false);
  });
});

// ── IdleDetector — Edge cases ────────────────────────────────
describe('IdleDetector — Edge cases', () => {
  it('handles maxInsightsPerHour of 0 (always skip)', () => {
    const detector = new IdleDetector({ maxInsightsPerHour: 0 });
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(true);
    expect(result.reason).toContain('insights');
  });

  it('handles very high maxInsightsPerHour', () => {
    const detector = new IdleDetector({ maxInsightsPerHour: 1000000 });
    detector.recordInsight();
    detector.recordInsight();
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(false);
  });

  it('reason message includes actual numbers', () => {
    const detector = new IdleDetector({ maxInsightsPerHour: 2 });
    const currentHour = Math.floor(Date.now() / 3600000);
    (detector as any).lastResetHour = currentHour;
    detector.recordInsight();
    detector.recordInsight();
    const result = detector.shouldSkipWork();
    expect(result.skip).toBe(true);
    expect(result.reason).toContain('2');
  });
});
