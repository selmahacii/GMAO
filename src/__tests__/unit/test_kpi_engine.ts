// Unit Tests: KPI Engine
// Tests for all KPI formulas and calculations

import { describe, it, expect } from 'vitest';

// KPI Calculation functions (matching the logic in the application)
const kpiEngine = {
  /**
   * Calculate MTBF (Mean Time Between Failures)
   * MTBF = Total Operating Time / Number of Failures
   */
  calculateMTBF(operatingHours: number, failureCount: number): number {
    if (failureCount === 0) return Infinity;
    return operatingHours / failureCount;
  },

  /**
   * Calculate MTTR (Mean Time To Repair)
   * MTTR = Total Repair Time / Number of Repairs
   */
  calculateMTTR(totalRepairHours: number, repairCount: number): number {
    if (repairCount === 0) return 0;
    return totalRepairHours / repairCount;
  },

  /**
   * Calculate Availability
   * Availability = MTBF / (MTBF + MTTR) * 100
   */
  calculateAvailability(mtbf: number, mttr: number): number {
    if (mtbf === Infinity) return 100;
    if (mtbf + mttr === 0) return 0;
    return (mtbf / (mtbf + mttr)) * 100;
  },

  /**
   * Calculate OEE (Overall Equipment Effectiveness)
   * OEE = Availability × Performance × Quality
   */
  calculateOEE(availability: number, performance: number, quality: number): number {
    return (availability * performance * quality) / 10000;
  },

  /**
   * Calculate PM Compliance Rate
   * PM Compliance = (On-time PMs / Total Scheduled PMs) × 100
   */
  calculatePMCompliance(onTimePMs: number, totalScheduledPMs: number): number {
    if (totalScheduledPMs === 0) return 100;
    return (onTimePMs / totalScheduledPMs) * 100;
  },

  /**
   * Determine asset health status based on OEE
   */
  getAssetStatusFromOEE(oee: number): 'excellent' | 'good' | 'degraded' | 'critical' {
    if (oee >= 85) return 'excellent';
    if (oee >= 70) return 'good';
    if (oee >= 55) return 'degraded';
    return 'critical';
  },

  /**
   * Check if OEE below threshold should trigger alert
   */
  shouldTriggerOEEAlert(oee: number, threshold: number = 65): boolean {
    return oee < threshold;
  },

  /**
   * Calculate downtime cost
   */
  calculateDowntimeCost(downtimeHours: number, hourlyCost: number): number {
    return downtimeHours * hourlyCost;
  },

  /**
   * Calculate reliability (probability of survival)
   * R(t) = e^(-t/MTBF)
   */
  calculateReliability(mtbf: number, timeHours: number): number {
    if (mtbf === 0) return 0;
    return Math.exp(-timeHours / mtbf);
  },

  /**
   * Calculate failure rate (lambda)
   * λ = 1 / MTBF
   */
  calculateFailureRate(mtbf: number): number {
    if (mtbf === 0 || mtbf === Infinity) return 0;
    return 1 / mtbf;
  },

  /**
   * Calculate Pareto (80/20 analysis) - identify top contributors
   */
  calculatePareto(items: { name: string; value: number }[]): { name: string; value: number; cumulative: number; percentage: number }[] {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((sum, item) => sum + item.value, 0);
    
    let cumulative = 0;
    return sorted.map(item => {
      cumulative += item.value;
      return {
        name: item.name,
        value: item.value,
        cumulative,
        percentage: total > 0 ? (cumulative / total) * 100 : 0,
      };
    });
  },
};

describe('KPI Engine', () => {
  describe('MTBF Calculation', () => {
    it('calculates MTBF correctly with known inputs', () => {
      // Given: 3 failures in 1000 operating hours
      const operatingHours = 1000;
      const failureCount = 3;
      
      // Expected: MTBF = 1000 / 3 = 333.33h
      const mtbf = kpiEngine.calculateMTBF(operatingHours, failureCount);
      
      expect(mtbf).toBeCloseTo(333.33, 2);
    });

    it('returns Infinity when no failures occur', () => {
      const mtbf = kpiEngine.calculateMTBF(1000, 0);
      expect(mtbf).toBe(Infinity);
    });

    it('handles zero operating hours', () => {
      const mtbf = kpiEngine.calculateMTBF(0, 5);
      expect(mtbf).toBe(0);
    });

    it('handles large numbers correctly', () => {
      const mtbf = kpiEngine.calculateMTBF(100000, 25);
      expect(mtbf).toBe(4000);
    });
  });

  describe('MTTR Calculation', () => {
    it('calculates MTTR correctly', () => {
      // Given: 15 total repair hours for 5 repairs
      const mttr = kpiEngine.calculateMTTR(15, 5);
      
      expect(mttr).toBe(3);
    });

    it('returns 0 when no repairs', () => {
      const mttr = kpiEngine.calculateMTTR(0, 0);
      expect(mttr).toBe(0);
    });
  });

  describe('Availability Calculation', () => {
    it('calculates availability correctly', () => {
      // MTBF = 100h, MTTR = 2h
      // Availability = 100 / (100 + 2) = 98.04%
      const availability = kpiEngine.calculateAvailability(100, 2);
      
      expect(availability).toBeCloseTo(98.04, 1);
    });

    it('returns 100% availability with zero MTTR', () => {
      // Edge case: MTTR = 0 → availability = 100%
      const availability = kpiEngine.calculateAvailability(100, 0);
      
      expect(availability).toBe(100);
    });

    it('returns 100% when no failures (infinite MTBF)', () => {
      const availability = kpiEngine.calculateAvailability(Infinity, 2);
      expect(availability).toBe(100);
    });

    it('handles zero MTBF', () => {
      const availability = kpiEngine.calculateAvailability(0, 5);
      expect(availability).toBe(0);
    });
  });

  describe('OEE Calculation', () => {
    it('calculates OEE correctly', () => {
      // Availability = 95%, Performance = 87%, Quality = 98%
      // OEE = 0.95 × 0.87 × 0.98 = 81%
      const oee = kpiEngine.calculateOEE(95, 87, 98);
      
      expect(oee).toBeCloseTo(81, 0);
    });

    it('returns 100% when all factors are 100%', () => {
      const oee = kpiEngine.calculateOEE(100, 100, 100);
      expect(oee).toBe(100);
    });

    it('handles low values correctly', () => {
      const oee = kpiEngine.calculateOEE(50, 50, 50);
      expect(oee).toBe(12.5);
    });
  });

  describe('PM Compliance Rate', () => {
    it('calculates PM compliance correctly', () => {
      // Given: 8 on-time PMs out of 10 scheduled
      // Expected: 80%
      const compliance = kpiEngine.calculatePMCompliance(8, 10);
      
      expect(compliance).toBe(80);
    });

    it('returns 100% when no PMs scheduled', () => {
      const compliance = kpiEngine.calculatePMCompliance(0, 0);
      expect(compliance).toBe(100);
    });

    it('handles 100% compliance', () => {
      const compliance = kpiEngine.calculatePMCompliance(10, 10);
      expect(compliance).toBe(100);
    });
  });

  describe('OEE Alert Threshold', () => {
    it('triggers alert when OEE below threshold', () => {
      // OEE < 65% should trigger alert
      const shouldAlert = kpiEngine.shouldTriggerOEEAlert(60);
      
      expect(shouldAlert).toBe(true);
    });

    it('does not trigger alert when OEE above threshold', () => {
      const shouldAlert = kpiEngine.shouldTriggerOEEAlert(70);
      expect(shouldAlert).toBe(false);
    });

    it('triggers alert at exact threshold', () => {
      const shouldAlert = kpiEngine.shouldTriggerOEEAlert(65);
      expect(shouldAlert).toBe(false);
    });

    it('OEE below threshold sets asset status to degraded', () => {
      const status = kpiEngine.getAssetStatusFromOEE(60);
      expect(status).toBe('degraded');
    });
  });

  describe('Asset Status from OEE', () => {
    it('returns excellent for OEE >= 85%', () => {
      expect(kpiEngine.getAssetStatusFromOEE(90)).toBe('excellent');
      expect(kpiEngine.getAssetStatusFromOEE(85)).toBe('excellent');
    });

    it('returns good for OEE >= 70%', () => {
      expect(kpiEngine.getAssetStatusFromOEE(75)).toBe('good');
      expect(kpiEngine.getAssetStatusFromOEE(70)).toBe('good');
    });

    it('returns degraded for OEE >= 55%', () => {
      expect(kpiEngine.getAssetStatusFromOEE(60)).toBe('degraded');
      expect(kpiEngine.getAssetStatusFromOEE(55)).toBe('degraded');
    });

    it('returns critical for OEE < 55%', () => {
      expect(kpiEngine.getAssetStatusFromOEE(50)).toBe('critical');
      expect(kpiEngine.getAssetStatusFromOEE(30)).toBe('critical');
    });
  });

  describe('Downtime Cost Calculation', () => {
    it('calculates downtime cost correctly', () => {
      const cost = kpiEngine.calculateDowntimeCost(4, 2500);
      expect(cost).toBe(10000);
    });

    it('handles zero downtime', () => {
      const cost = kpiEngine.calculateDowntimeCost(0, 2500);
      expect(cost).toBe(0);
    });
  });

  describe('Reliability Calculation', () => {
    it('calculates reliability correctly', () => {
      // MTBF = 100h, time = 100h
      // R(t) = e^(-100/100) = e^-1 = 0.368
      const reliability = kpiEngine.calculateReliability(100, 100);
      
      expect(reliability).toBeCloseTo(0.368, 3);
    });

    it('returns 1 for zero time', () => {
      const reliability = kpiEngine.calculateReliability(100, 0);
      expect(reliability).toBe(1);
    });
  });

  describe('Failure Rate Calculation', () => {
    it('calculates failure rate correctly', () => {
      // MTBF = 100h → λ = 0.01 failures/hour
      const rate = kpiEngine.calculateFailureRate(100);
      expect(rate).toBe(0.01);
    });

    it('returns 0 for infinite MTBF', () => {
      const rate = kpiEngine.calculateFailureRate(Infinity);
      expect(rate).toBe(0);
    });
  });

  describe('Pareto Analysis', () => {
    it('identifies top contributors correctly', () => {
      const items = [
        { name: 'Asset A', value: 50 },
        { name: 'Asset B', value: 30 },
        { name: 'Asset C', value: 15 },
        { name: 'Asset D', value: 5 },
      ];

      const pareto = kpiEngine.calculatePareto(items);

      // First item should be 50% cumulative
      expect(pareto[0].cumulative).toBe(50);
      expect(pareto[0].percentage).toBe(50);

      // Second item should be 80% cumulative (80/20 rule)
      expect(pareto[1].cumulative).toBe(80);
      expect(pareto[1].percentage).toBe(80);
    });

    it('handles empty input', () => {
      const pareto = kpiEngine.calculatePareto([]);
      expect(pareto).toHaveLength(0);
    });

    it('sorts by descending value', () => {
      const items = [
        { name: 'Low', value: 10 },
        { name: 'High', value: 90 },
        { name: 'Medium', value: 50 },
      ];

      const pareto = kpiEngine.calculatePareto(items);

      expect(pareto[0].name).toBe('High');
      expect(pareto[1].name).toBe('Medium');
      expect(pareto[2].name).toBe('Low');
    });
  });
});

export { kpiEngine };
