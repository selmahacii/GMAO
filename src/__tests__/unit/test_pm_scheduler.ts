// Unit Tests: PM Scheduler
// Tests for preventive maintenance scheduling logic

import { describe, it, expect, vi, beforeEach } from 'vitest';

// PM Scheduler Types
type PMFrequencyType = 'calendar' | 'meter' | 'usage';

interface PMSchedule {
  id: string;
  assetId: string;
  templateId: string;
  frequencyType: PMFrequencyType;
  intervalDays?: number;
  intervalMeterValue?: number;
  nextDueDate: Date;
  lastCompleted?: Date;
  active: boolean;
}

interface PMTemplate {
  id: string;
  name: string;
  frequencyType: PMFrequencyType;
  intervalDays?: number;
  intervalMeterValue?: number;
  estimatedDurationHours: number;
  requiredSkillLevel: number;
}

interface Asset {
  id: string;
  name: string;
  operatingHoursSinceLastPm: number;
  lastMaintenanceDate?: Date;
}

// PM Scheduler Logic
const pmScheduler = {
  /**
   * Calculate next due date based on calendar interval
   */
  calculateNextDueDate(lastCompleted: Date | undefined, intervalDays: number): Date {
    const base = lastCompleted || new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + intervalDays);
    return next;
  },

  /**
   * Check if PM is due based on calendar
   */
  isCalendarPMDue(nextDueDate: Date, bufferDays: number = 0): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueWithBuffer = new Date(nextDueDate);
    dueWithBuffer.setDate(dueWithBuffer.getDate() - bufferDays);
    
    return today >= dueWithBuffer;
  },

  /**
   * Check if meter-based PM is due
   */
  isMeterPMDue(currentReading: number, lastPMReading: number, interval: number, bufferPercent: number = 10): boolean {
    const nextPMReading = lastPMReading + interval;
    const buffer = interval * (bufferPercent / 100);
    return currentReading >= (nextPMReading - buffer);
  },

  /**
   * Check if PM is overdue
   */
  isPMOverdue(nextDueDate: Date): boolean {
    return new Date() > nextDueDate;
  },

  /**
   * Calculate days until next PM
   */
  daysUntilPM(nextDueDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = nextDueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Generate WO number for PM
   */
  generatePMWONumber(prefix: string = 'PM'): string {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
    return `${prefix}-${year}-${seq}`;
  },

  /**
   * Check if open PM WO already exists for asset/template
   */
  shouldCreateNewPM(
    assetId: string,
    templateId: string,
    existingOpenWOs: Array<{ assetId: string; templateId: string }>
  ): boolean {
    return !existingOpenWOs.some(
      wo => wo.assetId === assetId && wo.templateId === templateId
    );
  },

  /**
   * Calculate PM compliance for a period
   */
  calculatePMCompliance(
    scheduledPMs: number,
    completedOnTime: number,
    completedLate: number
  ): { rate: number; onTime: number; late: number; missed: number } {
    const totalCompleted = completedOnTime + completedLate;
    const missed = Math.max(0, scheduledPMs - totalCompleted);
    
    return {
      rate: scheduledPMs > 0 ? (completedOnTime / scheduledPMs) * 100 : 100,
      onTime: completedOnTime,
      late: completedLate,
      missed,
    };
  },

  /**
   * Get PM priority based on asset criticality and overdue days
   */
  getPMPriority(assetCriticality: 'A' | 'B' | 'C', overdueDays: number): 'P1_emergency' | 'P2_urgent' | 'P3_normal' {
    if (assetCriticality === 'A' && overdueDays > 0) return 'P1_emergency';
    if (assetCriticality === 'A' || overdueDays > 7) return 'P2_urgent';
    return 'P3_normal';
  },

  /**
   * Calculate PM schedule for next N periods
   */
  generatePMSchedule(
    lastCompleted: Date | undefined,
    intervalDays: number,
    periods: number
  ): Date[] {
    const dates: Date[] = [];
    let current = lastCompleted ? new Date(lastCompleted) : new Date();

    for (let i = 0; i < periods; i++) {
      current = this.calculateNextDueDate(current, intervalDays);
      dates.push(new Date(current));
    }

    return dates;
  },

  /**
   * Check if weekend/holiday (simplified)
   */
  isNonWorkingDay(date: Date, holidays: Date[] = []): boolean {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    
    const isHoliday = holidays.some(h => 
      h.getTime() === date.setHours(0, 0, 0, 0)
    );

    return isWeekend || isHoliday;
  },

  /**
   * Adjust due date to next working day
   */
  adjustToWorkingDay(date: Date, holidays: Date[] = []): Date {
    const adjusted = new Date(date);
    while (this.isNonWorkingDay(adjusted, holidays)) {
      adjusted.setDate(adjusted.getDate() + 1);
    }
    return adjusted;
  },

  /**
   * Calculate workload for technician
   */
  calculateTechnicianWorkload(
    assignedPMs: Array<{ estimatedHours: number }>,
    maxWeeklyHours: number = 40
  ): { totalHours: number; utilization: number; available: number } {
    const totalHours = assignedPMs.reduce((sum, pm) => sum + pm.estimatedHours, 0);
    
    return {
      totalHours,
      utilization: (totalHours / maxWeeklyHours) * 100,
      available: Math.max(0, maxWeeklyHours - totalHours),
    };
  },
};

describe('PM Scheduler', () => {
  describe('Calendar-based PM Due Calculation', () => {
    it('calculates next due date correctly from last completed', () => {
      const lastCompleted = new Date('2024-01-15');
      const intervalDays = 30;
      
      const nextDue = pmScheduler.calculateNextDueDate(lastCompleted, intervalDays);
      
      expect(nextDue.toISOString().split('T')[0]).toBe('2024-02-14');
    });

    it('uses today when no last completed date', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const nextDue = pmScheduler.calculateNextDueDate(undefined, 7);
      
      const expected = new Date(today);
      expected.setDate(expected.getDate() + 7);
      
      expect(nextDue.toDateString()).toBe(expected.toDateString());
    });

    it('handles monthly intervals (30 days)', () => {
      const lastCompleted = new Date('2024-01-01');
      const nextDue = pmScheduler.calculateNextDueDate(lastCompleted, 30);
      
      expect(nextDue.getMonth()).toBe(0); // January
      expect(nextDue.getDate()).toBe(31);
    });
  });

  describe('Calendar PM Due Detection', () => {
    it('detects PM is due when date reached', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 1); // Yesterday
      
      expect(pmScheduler.isCalendarPMDue(dueDate)).toBe(true);
    });

    it('detects PM is not yet due', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Next week
      
      expect(pmScheduler.isCalendarPMDue(dueDate)).toBe(false);
    });

    it('respects buffer days for early notification', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // 3 days from now
      
      // Without buffer - not due
      expect(pmScheduler.isCalendarPMDue(dueDate)).toBe(false);
      
      // With 5-day buffer - due
      expect(pmScheduler.isCalendarPMDue(dueDate, 5)).toBe(true);
    });
  });

  describe('Meter-based PM Due Detection', () => {
    it('detects meter PM is due when threshold reached', () => {
      const currentReading = 1050;
      const lastPMReading = 500;
      const interval = 500;
      
      expect(pmScheduler.isMeterPMDue(currentReading, lastPMReading, interval)).toBe(true);
    });

    it('detects meter PM is not yet due', () => {
      const currentReading = 800;
      const lastPMReading = 500;
      const interval = 500;
      
      expect(pmScheduler.isMeterPMDue(currentReading, lastPMReading, interval)).toBe(false);
    });

    it('respects buffer percentage for early notification', () => {
      const currentReading = 940; // 60 units before threshold
      const lastPMReading = 500;
      const interval = 500;
      
      // Without buffer - not due (needs 1000)
      expect(pmScheduler.isMeterPMDue(currentReading, lastPMReading, interval)).toBe(false);
      
      // With 15% buffer (75 units) - due
      expect(pmScheduler.isMeterPMDue(currentReading, lastPMReading, interval, 15)).toBe(true);
    });
  });

  describe('PM Overdue Detection', () => {
    it('detects overdue PM', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      expect(pmScheduler.isPMOverdue(pastDate)).toBe(true);
    });

    it('detects on-time PM', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      expect(pmScheduler.isPMOverdue(futureDate)).toBe(false);
    });
  });

  describe('Days Until PM Calculation', () => {
    it('calculates days until PM correctly', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);
      
      expect(pmScheduler.daysUntilPM(dueDate)).toBe(10);
    });

    it('returns negative for overdue PMs', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 3);
      
      expect(pmScheduler.daysUntilPM(dueDate)).toBe(-3);
    });
  });

  describe('Duplicate PM Prevention', () => {
    it('allows creating new PM when none exists', () => {
      const existingWOs: Array<{ assetId: string; templateId: string }> = [];
      
      expect(pmScheduler.shouldCreateNewPM('asset1', 'template1', existingWOs)).toBe(true);
    });

    it('prevents duplicate PM creation', () => {
      const existingWOs = [
        { assetId: 'asset1', templateId: 'template1' },
      ];
      
      expect(pmScheduler.shouldCreateNewPM('asset1', 'template1', existingWOs)).toBe(false);
    });

    it('allows PM for different template on same asset', () => {
      const existingWOs = [
        { assetId: 'asset1', templateId: 'template1' },
      ];
      
      expect(pmScheduler.shouldCreateNewPM('asset1', 'template2', existingWOs)).toBe(true);
    });
  });

  describe('PM Compliance Calculation', () => {
    it('calculates compliance correctly', () => {
      const result = pmScheduler.calculatePMCompliance(10, 8, 1);
      
      expect(result.rate).toBe(80);
      expect(result.onTime).toBe(8);
      expect(result.late).toBe(1);
      expect(result.missed).toBe(1);
    });

    it('returns 100% when no PMs scheduled', () => {
      const result = pmScheduler.calculatePMCompliance(0, 0, 0);
      
      expect(result.rate).toBe(100);
    });

    it('handles perfect compliance', () => {
      const result = pmScheduler.calculatePMCompliance(10, 10, 0);
      
      expect(result.rate).toBe(100);
      expect(result.missed).toBe(0);
    });
  });

  describe('PM Priority Assignment', () => {
    it('assigns P1 for critical asset with overdue PM', () => {
      expect(pmScheduler.getPMPriority('A', 1)).toBe('P1_emergency');
    });

    it('assigns P2 for critical asset on time', () => {
      expect(pmScheduler.getPMPriority('A', 0)).toBe('P2_urgent');
    });

    it('assigns P2 for any asset overdue > 7 days', () => {
      expect(pmScheduler.getPMPriority('C', 8)).toBe('P2_urgent');
    });

    it('assigns P3 for normal scenarios', () => {
      expect(pmScheduler.getPMPriority('B', 0)).toBe('P3_normal');
      expect(pmScheduler.getPMPriority('C', 5)).toBe('P3_normal');
    });
  });

  describe('PM Schedule Generation', () => {
    it('generates schedule for multiple periods', () => {
      const lastCompleted = new Date('2024-01-01');
      const dates = pmScheduler.generatePMSchedule(lastCompleted, 30, 4);
      
      expect(dates).toHaveLength(4);
      expect(dates[0].getMonth()).toBe(0); // Jan 31
      expect(dates[1].getMonth()).toBe(2); // Mar 1 (roughly)
    });
  });

  describe('Non-Working Day Handling', () => {
    it('detects weekend days', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const sunday = new Date('2024-01-07'); // Sunday
      const monday = new Date('2024-01-08'); // Monday
      
      expect(pmScheduler.isNonWorkingDay(saturday)).toBe(true);
      expect(pmScheduler.isNonWorkingDay(sunday)).toBe(true);
      expect(pmScheduler.isNonWorkingDay(monday)).toBe(false);
    });

    it('detects holidays', () => {
      const holiday = new Date('2024-01-01');
      const holidays = [new Date('2024-01-01')];
      
      expect(pmScheduler.isNonWorkingDay(holiday, holidays)).toBe(true);
    });

    it('adjusts due date to next working day', () => {
      const saturday = new Date('2024-01-06');
      const adjusted = pmScheduler.adjustToWorkingDay(saturday);
      
      expect(adjusted.getDay()).not.toBe(0); // Not Sunday
      expect(adjusted.getDay()).not.toBe(6); // Not Saturday
    });
  });

  describe('Technician Workload Calculation', () => {
    it('calculates workload correctly', () => {
      const assignedPMs = [
        { estimatedHours: 4 },
        { estimatedHours: 6 },
        { estimatedHours: 8 },
      ];
      
      const result = pmScheduler.calculateTechnicianWorkload(assignedPMs, 40);
      
      expect(result.totalHours).toBe(18);
      expect(result.utilization).toBe(45);
      expect(result.available).toBe(22);
    });

    it('detects overworked technician', () => {
      const assignedPMs = [
        { estimatedHours: 20 },
        { estimatedHours: 15 },
        { estimatedHours: 10 },
      ];
      
      const result = pmScheduler.calculateTechnicianWorkload(assignedPMs, 40);
      
      expect(result.utilization).toBe(112.5);
      expect(result.available).toBe(0);
    });
  });

  describe('Alert Generation for Overdue PM', () => {
    it('should trigger alert for overdue PM', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 5);
      
      const isOverdue = pmScheduler.isPMOverdue(overdueDate);
      
      expect(isOverdue).toBe(true);
      // In real app, this would create an Alert record
    });

    it('creates critical alert for critical asset overdue PM', () => {
      const priority = pmScheduler.getPMPriority('A', 5);
      
      expect(priority).toBe('P1_emergency');
      // In real app, this would create a critical severity alert
    });
  });
});

export { pmScheduler };
