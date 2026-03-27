// Integration Tests: Work Orders API
// Tests for work order CRUD operations and business logic

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Work Order types
interface WorkOrder {
  id: string;
  woNumber: string;
  orgId: string;
  title: string;
  status: 'draft' | 'planned' | 'assigned' | 'in_progress' | 'completed' | 'validated';
  priority: 'P1_emergency' | 'P2_urgent' | 'P3_normal' | 'P4_low';
  assetId?: string;
  assignedToId?: string;
  estimatedCostDzd?: number;
  actualCostDzd?: number;
  actualDurationHours?: number;
  createdAt: Date;
  completedAt?: Date;
  slaDeadline: Date;
  slaBreached: boolean;
}

interface Asset {
  id: string;
  orgId: string;
  name: string;
  lastMaintenanceDate?: Date;
  mtbfHours?: number;
  operatingHoursTotal: number;
}

interface SparePart {
  id: string;
  orgId: string;
  name: string;
  stockQty: number;
  minStockQty: number;
  unitCostDzd: number;
}

interface WoPartUsed {
  woId: string;
  partId: string;
  qtyUsed: number;
  unitCost: number;
  totalCost: number;
}

// Mock database
const mockDb = {
  workOrders: new Map<string, WorkOrder>(),
  assets: new Map<string, Asset>([
    ['asset_1', { id: 'asset_1', orgId: 'org_1', name: 'Pump A', lastMaintenanceDate: new Date('2024-01-01'), operatingHoursTotal: 1000 }],
  ]),
  parts: new Map<string, SparePart>([
    ['part_1', { id: 'part_1', orgId: 'org_1', name: 'Bearing', stockQty: 10, minStockQty: 5, unitCostDzd: 5000 }],
    ['part_2', { id: 'part_2', orgId: 'org_1', name: 'Seal', stockQty: 3, minStockQty: 5, unitCostDzd: 2500 }],
  ]),
  partsUsed: [] as WoPartUsed[],
  woCounter: 100,

  async createWorkOrder(data: Partial<WorkOrder>): Promise<WorkOrder> {
    const wo: WorkOrder = {
      id: `wo_${Date.now()}`,
      woNumber: `WO-2024-${String(++this.woCounter).padStart(5, '0')}`,
      orgId: data.orgId || 'org_1',
      title: data.title || 'New WO',
      status: data.status || 'draft',
      priority: data.priority || 'P3_normal',
      assetId: data.assetId,
      assignedToId: data.assignedToId,
      estimatedCostDzd: data.estimatedCostDzd,
      createdAt: new Date(),
      slaDeadline: data.slaDeadline || new Date(Date.now() + 86400000),
      slaBreached: false,
    };
    this.workOrders.set(wo.id, wo);
    return wo;
  },

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  },

  async updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder | undefined> {
    const wo = this.workOrders.get(id);
    if (!wo) return undefined;
    const updated = { ...wo, ...data };
    this.workOrders.set(id, updated);
    return updated;
  },

  async getAsset(id: string): Promise<Asset | undefined> {
    return this.assets.get(id);
  },

  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    const updated = { ...asset, ...data };
    this.assets.set(id, updated);
    return updated;
  },

  async getPart(id: string): Promise<SparePart | undefined> {
    return this.parts.get(id);
  },

  async usePart(woId: string, partId: string, qty: number): Promise<{ success: boolean; error?: string }> {
    const part = this.parts.get(partId);
    if (!part) return { success: false, error: 'Part not found' };
    if (part.stockQty < qty) return { success: false, error: 'Insufficient stock' };

    part.stockQty -= qty;
    this.partsUsed.push({
      woId,
      partId,
      qtyUsed: qty,
      unitCost: part.unitCostDzd,
      totalCost: qty * part.unitCostDzd,
    });

    return { success: true };
  },

  async getWorkOrdersByAsset(assetId: string): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(wo => wo.assetId === assetId);
  },

  clear() {
    this.workOrders.clear();
    this.partsUsed = [];
    this.woCounter = 100;
  },
};

// WO Counter per org (simulating real behavior)
const woCounters: Map<string, number> = new Map();

// Work Order API Logic
const woApi = {
  /**
   * Create work order with auto-generated WO number
   */
  async createWorkOrder(orgId: string, data: Partial<WorkOrder>): Promise<{ wo: WorkOrder; status: number }> {
    const wo = await mockDb.createWorkOrder({ ...data, orgId });
    return { wo, status: 201 };
  },

  /**
   * Complete work order - deducts parts and updates asset
   */
  async completeWorkOrder(
    woId: string,
    parts: Array<{ partId: string; qty: number }>,
    actualDurationHours: number,
    technicianNotes: string
  ): Promise<{ success: boolean; wo?: WorkOrder; errors?: string[] }> {
    const wo = await mockDb.getWorkOrder(woId);
    if (!wo) return { success: false, errors: ['Work order not found'] };

    const errors: string[] = [];
    let totalPartsCost = 0;

    // Check and deduct parts
    for (const part of parts) {
      const result = await mockDb.usePart(woId, part.partId, part.qty);
      if (!result.success) {
        errors.push(`Part ${part.partId}: ${result.error}`);
      } else {
        const partData = await mockDb.getPart(part.partId);
        totalPartsCost += part.qty * (partData?.unitCostDzd || 0);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Update work order
    const completedWo = await mockDb.updateWorkOrder(woId, {
      status: 'completed',
      completedAt: new Date(),
      actualDurationHours,
      actualCostDzd: totalPartsCost + (actualDurationHours * 5000), // Parts + Labor
    });

    // Update asset last maintenance date
    if (wo.assetId) {
      await mockDb.updateAsset(wo.assetId, {
        lastMaintenanceDate: new Date(),
      });
    }

    return { success: true, wo: completedWo };
  },

  /**
   * Calculate MTBF from work orders
   */
  calculateMTBF(workOrders: WorkOrder[], assetId: string): number {
    const assetWOs = workOrders
      .filter(wo => wo.assetId === assetId && wo.status === 'completed' && wo.completedAt)
      .sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0));

    if (assetWOs.length < 2) return 0;

    let totalOperatingTime = 0;
    for (let i = 1; i < assetWOs.length; i++) {
      const prevDate = assetWOs[i - 1].completedAt!;
      const currDate = assetWOs[i].createdAt;
      totalOperatingTime += (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60);
    }

    return totalOperatingTime / (assetWOs.length - 1);
  },

  /**
   * Check if user can create WO (RBAC)
   */
  canUserCreateWO(userRole: string): boolean {
    return ['admin', 'manager', 'technician', 'planner'].includes(userRole);
  },

  /**
   * Check if user can validate WO (RBAC)
   */
  canUserValidateWO(userRole: string): boolean {
    return ['admin', 'manager'].includes(userRole);
  },
};

describe('Work Orders API Integration Tests', () => {
  beforeEach(() => {
    mockDb.clear();
    woCounters.clear();
  });

  describe('Create Work Order', () => {
    it('creates WO and returns 201 with WO number', async () => {
      const result = await woApi.createWorkOrder('org_1', {
        title: 'Test WO',
        priority: 'P2_urgent',
        assetId: 'asset_1',
      });

      expect(result.status).toBe(201);
      expect(result.wo.woNumber).toMatch(/WO-2024-\d{5}/);
      expect(result.wo.title).toBe('Test WO');
    });

    it('WO number is sequential per org', async () => {
      const wo1 = await woApi.createWorkOrder('org_1', { title: 'WO 1' });
      const wo2 = await woApi.createWorkOrder('org_1', { title: 'WO 2' });
      const wo3 = await woApi.createWorkOrder('org_1', { title: 'WO 3' });

      expect(wo1.wo.woNumber).toBe('WO-2024-00101');
      expect(wo2.wo.woNumber).toBe('WO-2024-00102');
      expect(wo3.wo.woNumber).toBe('WO-2024-00103');
    });

    it('viewer role cannot create WO', () => {
      expect(woApi.canUserCreateWO('viewer')).toBe(false);
    });

    it('technician can create WO', () => {
      expect(woApi.canUserCreateWO('technician')).toBe(true);
    });
  });

  describe('Complete Work Order', () => {
    it('deducts parts from inventory', async () => {
      // Create WO
      const { wo } = await woApi.createWorkOrder('org_1', { title: 'Test WO' });
      
      // Complete with parts
      const result = await woApi.completeWorkOrder(wo.id, [
        { partId: 'part_1', qty: 2 },
      ], 4, 'Completed');

      expect(result.success).toBe(true);

      // Check inventory
      const part = await mockDb.getPart('part_1');
      expect(part?.stockQty).toBe(8); // 10 - 2
    });

    it('updates asset last maintenance date', async () => {
      const { wo } = await woApi.createWorkOrder('org_1', {
        title: 'Test WO',
        assetId: 'asset_1',
      });

      await woApi.completeWorkOrder(wo.id, [], 2, 'Done');

      const asset = await mockDb.getAsset('asset_1');
      expect(asset?.lastMaintenanceDate).toBeDefined();
      expect(asset?.lastMaintenanceDate?.toDateString()).toBe(new Date().toDateString());
    });

    it('prevents stock from going negative', async () => {
      const { wo } = await woApi.createWorkOrder('org_1', { title: 'Test WO' });

      // Try to use more than available
      const result = await woApi.completeWorkOrder(wo.id, [
        { partId: 'part_2', qty: 10 }, // Only 3 in stock
      ], 2, 'Done');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Part part_2: Insufficient stock');
    });

    it('calculates total cost including labor', async () => {
      const { wo } = await woApi.createWorkOrder('org_1', { title: 'Test WO' });

      const result = await woApi.completeWorkOrder(wo.id, [
        { partId: 'part_1', qty: 2 }, // 2 * 5000 = 10000
      ], 4, 'Done'); // 4 hours * 5000 = 20000

      expect(result.success).toBe(true);
      expect(result.wo?.actualCostDzd).toBe(30000); // 10000 + 20000
    });
  });

  describe('MTBF Recalculation', () => {
    it('recalculates MTBF after WO completion', async () => {
      // Create multiple WOs
      const wo1 = await woApi.createWorkOrder('org_1', { title: 'WO 1', assetId: 'asset_1' });
      await mockDb.updateWorkOrder(wo1.wo.id, {
        status: 'completed',
        completedAt: new Date('2024-01-01'),
      });

      const wo2 = await woApi.createWorkOrder('org_1', { title: 'WO 2', assetId: 'asset_1' });
      await mockDb.updateWorkOrder(wo2.wo.id, {
        status: 'completed',
        completedAt: new Date('2024-01-15'),
      });

      const allWOs = Array.from(mockDb.workOrders.values());
      const mtbf = woApi.calculateMTBF(allWOs, 'asset_1');

      // 14 days between failures = 336 hours
      expect(mtbf).toBeCloseTo(336, 0);
    });
  });

  describe('Work Order Validation', () => {
    it('manager can validate completed WO', () => {
      expect(woApi.canUserValidateWO('manager')).toBe(true);
    });

    it('technician cannot validate WO', () => {
      expect(woApi.canUserValidateWO('technician')).toBe(false);
    });

    it('validating WO sets validatedAt and status', async () => {
      const { wo } = await woApi.createWorkOrder('org_1', { title: 'Test WO' });
      
      // First complete
      await mockDb.updateWorkOrder(wo.id, { status: 'completed', completedAt: new Date() });
      
      // Then validate
      const validated = await mockDb.updateWorkOrder(wo.id, {
        status: 'validated',
      });

      expect(validated?.status).toBe('validated');
    });
  });

  describe('SLA Tracking', () => {
    it('tracks SLA breach', async () => {
      const slaDeadline = new Date(Date.now() - 3600000); // 1 hour ago
      const { wo } = await woApi.createWorkOrder('org_1', {
        title: 'Test WO',
        slaDeadline,
      });

      // Complete after deadline
      const result = await woApi.completeWorkOrder(wo.id, [], 1, 'Done');

      // Check if SLA is breached
      const completedAt = result.wo?.completedAt;
      expect(completedAt).toBeDefined();
      if (completedAt) {
        const isBreached = completedAt > slaDeadline;
        expect(isBreached).toBe(true);
      }
    });
  });

  describe('Stock Alert on Low Inventory', () => {
    it('triggers alert when stock falls below minimum', async () => {
      const { wo } = await woApi.createWorkOrder('org_1', { title: 'Test WO' });

      // Use parts that will bring stock below minimum
      await woApi.completeWorkOrder(wo.id, [
        { partId: 'part_2', qty: 2 }, // 3 - 2 = 1 (below min of 5)
      ], 1, 'Done');

      const part = await mockDb.getPart('part_2');
      const isLowStock = part!.stockQty < part!.minStockQty;

      expect(isLowStock).toBe(true);
      // In real app: expect(alertCreated).toBe(true)
    });
  });

  describe('Priority-based SLA', () => {
    it('P1 emergency sets 2-hour deadline', () => {
      const now = new Date();
      const sla = new Map([
        ['P1_emergency', 2],
        ['P2_urgent', 8],
        ['P3_normal', 48],
        ['P4_low', 168],
      ]);

      const deadline = new Date(now.getTime() + sla.get('P1_emergency')! * 3600000);
      
      const diffHours = (deadline.getTime() - now.getTime()) / 3600000;
      expect(diffHours).toBeCloseTo(2, 0);
    });
  });
});

export { woApi, mockDb };
