import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

/**
 * IdleDetector: checks if the system is idle enough to skip work
 * 
 * Skip conditions:
 * - Battery < 20% (laptop mode)
 * - No user keyboard/mouse input for 10 minutes  
 * - CPU temperature > 80°C
 * - Already produced N insights this hour (diminishing returns)
 */
export interface IdleConfig {
  minBatteryPercent: number;
  maxIdleMinutes: number;
  maxTempCelsius: number;
  maxInsightsPerHour: number;
}

export const DEFAULT_IDLE_CONFIG: IdleConfig = {
  minBatteryPercent: 20,
  maxIdleMinutes: 10,
  maxTempCelsius: 80,
  maxInsightsPerHour: 5,
};

export class IdleDetector {
  private config: IdleConfig;
  private insightsThisHour: number = 0;
  private lastResetHour: number = 0;
  private lastActivityTime: number = Date.now();
  
  constructor(config: Partial<IdleConfig> = {}) {
    this.config = { ...DEFAULT_IDLE_CONFIG, ...config };
  }
  
  /**
   * Check if we should skip work
   */
  shouldSkipWork(): { skip: boolean; reason: string } {
    // Reset hourly counter
    const currentHour = Math.floor(Date.now() / 3600000);
    if (currentHour > this.lastResetHour) {
      this.insightsThisHour = 0;
      this.lastResetHour = currentHour;
    }
    
    // Diminishing returns check
    if (this.insightsThisHour >= this.config.maxInsightsPerHour) {
      return { skip: true, reason: `Already produced ${this.insightsThisHour} insights this hour (max: ${this.config.maxInsightsPerHour})` };
    }
    
    // Battery check (Linux)
    const batteryLevel = this.getBatteryLevel();
    if (batteryLevel !== null && batteryLevel < this.config.minBatteryPercent) {
      return { skip: true, reason: `Battery at ${batteryLevel}% (min: ${this.config.minBatteryPercent}%)` };
    }
    
    // User idle time check
    const idleSeconds = this.getUserIdleTime();
    if (idleSeconds > this.config.maxIdleMinutes * 60) {
      return { skip: true, reason: `User idle for ${Math.floor(idleSeconds / 60)} minutes (max: ${this.config.maxIdleMinutes})` };
    }
    
    // Temperature check
    const temp = this.getCPUTemperature();
    if (temp !== null && temp > this.config.maxTempCelsius) {
      return { skip: true, reason: `CPU at ${temp}°C (max: ${this.config.maxTempCelsius}°C)` };
    }
    
    return { skip: false, reason: '' };
  }
  
  /**
   * Record that an insight was produced
   */
  recordInsight(): void {
    this.insightsThisHour++;
  }
  
  /**
   * Get battery level (Linux)
   */
  private getBatteryLevel(): number | null {
    try {
      const path = '/sys/class/power_supply/BAT0/capacity';
      if (fs.existsSync(path)) {
        return parseInt(fs.readFileSync(path, 'utf8').trim(), 10);
      }
      // Try upower
      const output = execSync('upower -i /org/freedesktop/UPower/devices/battery_BAT0 2>/dev/null | grep percentage', { encoding: 'utf8' });
      const match = output.match(/(\d+)%/);
      if (match) return parseInt(match[1], 10);
    } catch {
      // Ignore errors
    }
    return null; // Unknown
  }
  
  /**
   * Get user idle time in seconds (Linux)
   */
  private getUserIdleTime(): number {
    try {
      const output = execSync('xprintidle 2>/dev/null || echo 0', { encoding: 'utf8' });
      return parseInt(output.trim(), 10) / 1000; // Convert ms to seconds
    } catch {
      // Try alternative method
      try {
        const who = execSync('who -s 2>/dev/null || echo ""', { encoding: 'utf8' });
        if (!who.trim()) {
          // No users logged in via GUI
          return 0; // Assume active (server context)
        }
      } catch {
        // Ignore
      }
    }
    // Default to 0 (active) if we can't determine
    this.lastActivityTime = Date.now();
    return 0;
  }
  
  /**
   * Get CPU temperature (Linux)
   */
  private getCPUTemperature(): number | null {
    try {
      // Try thermal zone
      const zones = fs.readdirSync('/sys/class/thermal/');
      for (const zone of zones) {
        if (zone.startsWith('thermal_zone')) {
          const typePath = `/sys/class/thermal/${zone}/type`;
          const tempPath = `/sys/class/thermal/${zone}/temp`;
          if (fs.existsSync(typePath) && fs.existsSync(tempPath)) {
            const type = fs.readFileSync(typePath, 'utf8').trim();
            if (type === 'x86_pkg_temp' || type === 'cpu' || type === 'acpitz') {
              const temp = parseInt(fs.readFileSync(tempPath, 'utf8').trim(), 10);
              return temp / 1000;
            }
          }
        }
      }
      // Try vcgencmd
      const output = execSync('vcgencmd measure_temp 2>/dev/null || echo "temp=0"', { encoding: 'utf8' });
      const match = output.match(/temp=([\d.]+)/);
      if (match) return parseFloat(match[1]);
    } catch {
      // Ignore
    }
    return null;
  }
}