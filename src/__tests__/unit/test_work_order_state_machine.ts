// Unit Tests: Work Order State Machine
// Tests for all valid and invalid status transitions

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Work Order Status Types
type WOStatus = 'draft' | 'planned' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'validated';
type WOPriority = 'P1_emergency' | 'P2_urgent' | 'P3_normal' | 'P4_low';

// Valid state transitions map
const VALID_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['assigned', 'draft', 'cancelled'],
  assigned: ['in_progress', 'planned', 'on_hold', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'assigned'],
  on_hold: ['in_progress', 'assigned', 'cancelled'],
  completed: ['validated'],
  cancelled: ['draft'], // Can reopen cancelled WOs
  validated: [], // Terminal state
};

// SLA deadlines by priority (in hours from creation)
const SLA_DEADLINES: Record<WOPriority, number> = {
  P1_emergency: 2,
  P2_urgent: 8,
  P3_normal: 48,
  P4_low: 168, // 7 days
};

// Work Order State Machine
const woStateMachine = {
  /**
   * Check if a transition is valid
   */
  isValidTransition(currentStatus: WOStatus, newStatus: WOStatus): boolean {
    return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
  },

  /**
   * Get all valid next statuses
   */
  getValidTransitions(currentStatus: WOStatus): WOStatus[] {
    return VALID_TRANSITIONS[currentStatus] ?? [];
  },

  /**
   * Calculate SLA deadline based on priority
   */
  calculateSLADeadline(priority: WOPriority, createdAt: Date): Date {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + SLA_DEADLINES[priority]);
    return deadline;
  },

  /**
   * Check if SLA is breached
   */
  isSLABreached(deadline: Date, completedAt: Date | null): boolean {
    if (!completedAt) {
      return new Date() > deadline;
    }
    return completedAt > deadline;
  },

  /**
   * Auto-assign technician for P1 emergencies
   */
  shouldAutoAssign(priority: WOPriority): boolean {
    return priority === 'P1_emergency';
  },

  /**
   * Get priority score (lower = more urgent)
   */
  getPriorityScore(priority: WOPriority): number {
    const scores: Record<WOPriority, number> = {
      P1_emergency: 1,
      P2_urgent: 2,
      P3_normal: 3,
      P4_low: 4,
    };
    return scores[priority];
  },

  /**
   * Attempt transition - returns new status or throws error
   */
  transition(currentStatus: WOStatus, newStatus: WOStatus): WOStatus {
    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid transition from "${currentStatus}" to "${newStatus}". Valid transitions: ${this.getValidTransitions(currentStatus).join(', ')}`
      );
    }
    return newStatus;
  },

  /**
   * Check if status is terminal (no further transitions)
   */
  isTerminalStatus(status: WOStatus): boolean {
    return VALID_TRANSITIONS[status].length === 0;
  },

  /**
   * Check if WO can be edited
   */
  canEdit(status: WOStatus): boolean {
    return status !== 'validated' && status !== 'cancelled';
  },

  /**
   * Check if WO requires validation
   */
  requiresValidation(status: WOStatus): boolean {
    return status === 'completed';
  },

  /**
   * Get estimated resolution time based on priority and estimated duration
   */
  getEstimatedResolution(priority: WOPriority, estimatedHours: number): Date {
    const now = new Date();
    // Add buffer based on priority
    const bufferHours = priority === 'P1_emergency' ? 0.5 : 
                        priority === 'P2_urgent' ? 2 : 4;
    now.setHours(now.getHours() + estimatedHours + bufferHours);
    return now;
  },
};

describe('Work Order State Machine', () => {
  describe('Valid Transitions', () => {
    it('allows transition from draft to planned', () => {
      expect(woStateMachine.isValidTransition('draft', 'planned')).toBe(true);
    });

    it('allows transition from planned to assigned', () => {
      expect(woStateMachine.isValidTransition('planned', 'assigned')).toBe(true);
    });

    it('allows transition from assigned to in_progress', () => {
      expect(woStateMachine.isValidTransition('assigned', 'in_progress')).toBe(true);
    });

    it('allows transition from in_progress to completed', () => {
      expect(woStateMachine.isValidTransition('in_progress', 'completed')).toBe(true);
    });

    it('allows transition from completed to validated', () => {
      expect(woStateMachine.isValidTransition('completed', 'validated')).toBe(true);
    });

    it('allows transition from in_progress to on_hold', () => {
      expect(woStateMachine.isValidTransition('in_progress', 'on_hold')).toBe(true);
    });

    it('allows transition from on_hold back to in_progress', () => {
      expect(woStateMachine.isValidTransition('on_hold', 'in_progress')).toBe(true);
    });

    it('allows cancellation from draft', () => {
      expect(woStateMachine.isValidTransition('draft', 'cancelled')).toBe(true);
    });

    it('allows cancellation from planned', () => {
      expect(woStateMachine.isValidTransition('planned', 'cancelled')).toBe(true);
    });

    it('allows cancellation from assigned', () => {
      expect(woStateMachine.isValidTransition('assigned', 'cancelled')).toBe(true);
    });

    it('allows cancellation from on_hold', () => {
      expect(woStateMachine.isValidTransition('on_hold', 'cancelled')).toBe(true);
    });

    it('allows reopening cancelled WO to draft', () => {
      expect(woStateMachine.isValidTransition('cancelled', 'draft')).toBe(true);
    });
  });

  describe('Invalid Transitions', () => {
    it('rejects transition from completed to draft', () => {
      expect(() => woStateMachine.transition('completed', 'draft')).toThrow(
        'Invalid transition from "completed" to "draft"'
      );
    });

    it('rejects transition from validated to any status', () => {
      expect(woStateMachine.isValidTransition('validated', 'completed')).toBe(false);
      expect(woStateMachine.isValidTransition('validated', 'draft')).toBe(false);
      expect(woStateMachine.isValidTransition('validated', 'cancelled')).toBe(false);
    });

    it('rejects transition from draft directly to in_progress', () => {
      expect(woStateMachine.isValidTransition('draft', 'in_progress')).toBe(false);
    });

    it('rejects transition from planned directly to completed', () => {
      expect(woStateMachine.isValidTransition('planned', 'completed')).toBe(false);
    });

    it('rejects transition from cancelled to completed', () => {
      expect(woStateMachine.isValidTransition('cancelled', 'completed')).toBe(false);
    });

    it('rejects transition from draft to completed', () => {
      expect(woStateMachine.isValidTransition('draft', 'completed')).toBe(false);
    });
  });

  describe('SLA Deadline Calculation', () => {
    it('sets P1 emergency SLA to now + 2 hours', () => {
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const deadline = woStateMachine.calculateSLADeadline('P1_emergency', createdAt);
      
      expect(deadline.toISOString()).toBe('2024-01-15T12:00:00.000Z');
    });

    it('sets P2 urgent SLA to now + 8 hours', () => {
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const deadline = woStateMachine.calculateSLADeadline('P2_urgent', createdAt);
      
      expect(deadline.toISOString()).toBe('2024-01-15T18:00:00.000Z');
    });

    it('sets P3 normal SLA to now + 48 hours', () => {
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const deadline = woStateMachine.calculateSLADeadline('P3_normal', createdAt);
      
      expect(deadline.toISOString()).toBe('2024-01-17T10:00:00.000Z');
    });

    it('sets P4 low SLA to now + 7 days', () => {
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const deadline = woStateMachine.calculateSLADeadline('P4_low', createdAt);
      
      expect(deadline.toISOString()).toBe('2024-01-22T10:00:00.000Z');
    });
  });

  describe('SLA Breach Detection', () => {
    it('detects SLA breach when completed after deadline', () => {
      const deadline = new Date('2024-01-15T12:00:00Z');
      const completedAt = new Date('2024-01-15T14:00:00Z');
      
      expect(woStateMachine.isSLABreached(deadline, completedAt)).toBe(true);
    });

    it('does not breach when completed before deadline', () => {
      const deadline = new Date('2024-01-15T12:00:00Z');
      const completedAt = new Date('2024-01-15T11:00:00Z');
      
      expect(woStateMachine.isSLABreached(deadline, completedAt)).toBe(false);
    });

    it('detects breach for incomplete WOs past deadline', () => {
      const pastDeadline = new Date(Date.now() - 3600000); // 1 hour ago
      const isBreached = woStateMachine.isSLABreached(pastDeadline, null);
      
      expect(isBreached).toBe(true);
    });
  });

  describe('Auto-Assignment for P1', () => {
    it('should auto-assign P1 emergency work orders', () => {
      expect(woStateMachine.shouldAutoAssign('P1_emergency')).toBe(true);
    });

    it('should not auto-assign other priorities', () => {
      expect(woStateMachine.shouldAutoAssign('P2_urgent')).toBe(false);
      expect(woStateMachine.shouldAutoAssign('P3_normal')).toBe(false);
      expect(woStateMachine.shouldAutoAssign('P4_low')).toBe(false);
    });
  });

  describe('Priority Scoring', () => {
    it('assigns correct priority scores', () => {
      expect(woStateMachine.getPriorityScore('P1_emergency')).toBe(1);
      expect(woStateMachine.getPriorityScore('P2_urgent')).toBe(2);
      expect(woStateMachine.getPriorityScore('P3_normal')).toBe(3);
      expect(woStateMachine.getPriorityScore('P4_low')).toBe(4);
    });
  });

  describe('Terminal Status Detection', () => {
    it('identifies validated as terminal status', () => {
      expect(woStateMachine.isTerminalStatus('validated')).toBe(true);
    });

    it('identifies non-terminal statuses', () => {
      expect(woStateMachine.isTerminalStatus('draft')).toBe(false);
      expect(woStateMachine.isTerminalStatus('in_progress')).toBe(false);
      expect(woStateMachine.isTerminalStatus('completed')).toBe(false);
    });
  });

  describe('Edit Permissions', () => {
    it('allows editing non-validated WOs', () => {
      expect(woStateMachine.canEdit('draft')).toBe(true);
      expect(woStateMachine.canEdit('planned')).toBe(true);
      expect(woStateMachine.canEdit('in_progress')).toBe(true);
      expect(woStateMachine.canEdit('completed')).toBe(true);
    });

    it('disallows editing validated WOs', () => {
      expect(woStateMachine.canEdit('validated')).toBe(false);
    });

    it('disallows editing cancelled WOs', () => {
      expect(woStateMachine.canEdit('cancelled')).toBe(false);
    });
  });

  describe('Validation Requirements', () => {
    it('requires validation for completed WOs', () => {
      expect(woStateMachine.requiresValidation('completed')).toBe(true);
    });

    it('does not require validation for other statuses', () => {
      expect(woStateMachine.requiresValidation('in_progress')).toBe(false);
      expect(woStateMachine.requiresValidation('validated')).toBe(false);
    });
  });

  describe('Complete Workflow Test', () => {
    it('follows complete valid workflow: draft → validated', () => {
      let status: WOStatus = 'draft';

      // Draft → Planned
      status = woStateMachine.transition(status, 'planned');
      expect(status).toBe('planned');

      // Planned → Assigned
      status = woStateMachine.transition(status, 'assigned');
      expect(status).toBe('assigned');

      // Assigned → In Progress
      status = woStateMachine.transition(status, 'in_progress');
      expect(status).toBe('in_progress');

      // In Progress → Completed
      status = woStateMachine.transition(status, 'completed');
      expect(status).toBe('completed');

      // Completed → Validated
      status = woStateMachine.transition(status, 'validated');
      expect(status).toBe('validated');

      // Should be terminal
      expect(woStateMachine.isTerminalStatus(status)).toBe(true);
    });

    it('handles on-hold scenario correctly', () => {
      let status: WOStatus = 'assigned';
      
      // Assigned → In Progress
      status = woStateMachine.transition(status, 'in_progress');
      
      // In Progress → On Hold
      status = woStateMachine.transition(status, 'on_hold');
      expect(status).toBe('on_hold');
      
      // On Hold → Back to In Progress
      status = woStateMachine.transition(status, 'in_progress');
      expect(status).toBe('in_progress');
    });
  });
});

export { woStateMachine, VALID_TRANSITIONS, SLA_DEADLINES };
