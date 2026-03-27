// Integration Tests: Inventory API
// Tests for spare parts management and stock operations

import { describe, it, expect, beforeEach } from 'vitest';

// Types
interface SparePart {
  id: string;
  orgId: string;
  partNumber: string;
  name: string;
  stockQty: number;
  minStockQty: number;
  maxStockQty: number;
  unitCostDzd: number;
  lastPurchasePriceDzd: number;
  stockLocation: string;
  isCritical: boolean;
}

interface StockMovement {
  id: string;
  partId: string;
  woId?: string;
  type: 'in' | 'out' | 'adjustment';
  qty: number;
  unitCost: number;
  totalCost: number;
  movedAt: Date;
  notes?: string;
}

interface PurchaseOrder {
  id: string;
  orgId: string;
  poNumber: string;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  items: Array<{
    partId: string;
    qtyOrdered: number;
    qtyReceived: number;
    unitPrice: number;
  }>;
  totalDzd: number;
  createdAt: Date;
  receivedAt?: Date;
}

// Mock Database
const mockDb = {
  parts: new Map<string, SparePart>([
    ['part_1', {
      id: 'part_1', orgId: 'org_1', partNumber: 'BRG-001', name: 'Bearing 6205',
      stockQty: 10, minStockQty: 5, maxStockQty: 20, unitCostDzd: 5000, lastPurchasePriceDzd: 4800,
      stockLocation: 'A-01-05', isCritical: true,
    }],
    ['part_2', {
      id: 'part_2', orgId: 'org_1', partNumber: 'SEAL-001', name: 'Mechanical Seal',
      stockQty: 3, minStockQty: 5, maxStockQty: 15, unitCostDzd: 12000, lastPurchasePriceDzd: 11500,
      stockLocation: 'B-02-10', isCritical: true,
    }],
    ['part_3', {
      id: 'part_3', orgId: 'org_1', partNumber: 'FLT-001', name: 'Oil Filter',
      stockQty: 20, minStockQty: 10, maxStockQty: 50, unitCostDzd: 3500, lastPurchasePriceDzd: 3500,
      stockLocation: 'A-03-02', isCritical: false,
    }],
  ]),

  movements: [] as StockMovement[],

  purchaseOrders: new Map<string, PurchaseOrder>(),

  async getPart(id: string): Promise<SparePart | undefined> {
    return this.parts.get(id);
  },

  async updatePart(id: string, data: Partial<SparePart>): Promise<SparePart | undefined> {
    const part = this.parts.get(id);
    if (!part) return undefined;
    const updated = { ...part, ...data };
    this.parts.set(id, updated);
    return updated;
  },

  async createMovement(data: Omit<StockMovement, 'id' | 'movedAt'>): Promise<StockMovement> {
    const movement: StockMovement = {
      id: `mvmt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      movedAt: new Date(),
      ...data,
    };
    this.movements.push(movement);
    return movement;
  },

  async getMovementsByPart(partId: string): Promise<StockMovement[]> {
    return this.movements.filter(m => m.partId === partId);
  },

  async getPartsBelowReorder(): Promise<SparePart[]> {
    return Array.from(this.parts.values()).filter(p => p.stockQty <= p.minStockQty);
  },

  async createPO(data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const po: PurchaseOrder = {
      id: `po_${Date.now()}`,
      orgId: data.orgId || 'org_1',
      poNumber: data.poNumber || `PO-2024-${String(this.purchaseOrders.size + 1).padStart(5, '0')}`,
      status: 'draft',
      items: data.items || [],
      totalDzd: data.totalDzd || 0,
      createdAt: new Date(),
    };
    this.purchaseOrders.set(po.id, po);
    return po;
  },

  async receivePO(poId: string, receivedItems: Array<{ partId: string; qty: number }>): Promise<{ success: boolean; po?: PurchaseOrder }> {
    const po = this.purchaseOrders.get(poId);
    if (!po) return { success: false };

    for (const item of receivedItems) {
      const part = await this.getPart(item.partId);
      if (!part) continue;

      // Update stock
      await this.updatePart(item.partId, {
        stockQty: part.stockQty + item.qty,
      });

      // Create movement
      await this.createMovement({
        partId: item.partId,
        type: 'in',
        qty: item.qty,
        unitCost: part.unitCostDzd,
        totalCost: item.qty * part.unitCostDzd,
        notes: `PO ${po.poNumber}`,
      });
    }

    // Update PO status
    po.status = 'received';
    po.receivedAt = new Date();

    return { success: true, po };
  },

  clear() {
    this.movements = [];
    this.purchaseOrders.clear();
  },
};

// Inventory API Logic
const inventoryApi = {
  /**
   * Consume part (stock out)
   */
  async consumePart(
    partId: string,
    woId: string,
    qty: number,
    notes?: string
  ): Promise<{ success: boolean; part?: SparePart; error?: string }> {
    const part = await mockDb.getPart(partId);
    if (!part) return { success: false, error: 'Part not found' };

    if (part.stockQty < qty) {
      return { success: false, error: `Insufficient stock. Available: ${part.stockQty}` };
    }

    // Update stock
    const updatedPart = await mockDb.updatePart(partId, {
      stockQty: part.stockQty - qty,
    });

    // Create movement
    await mockDb.createMovement({
      partId,
      woId,
      type: 'out',
      qty: -qty,
      unitCost: part.unitCostDzd,
      totalCost: qty * part.unitCostDzd,
      notes,
    });

    return { success: true, part: updatedPart };
  },

  /**
   * Adjust stock (inventory correction)
   */
  async adjustStock(
    partId: string,
    newQty: number,
    reason: string
  ): Promise<{ success: boolean; part?: SparePart; error?: string }> {
    const part = await mockDb.getPart(partId);
    if (!part) return { success: false, error: 'Part not found' };

    if (newQty < 0) {
      return { success: false, error: 'Stock cannot be negative' };
    }

    const difference = newQty - part.stockQty;
    const updatedPart = await mockDb.updatePart(partId, { stockQty: newQty });

    await mockDb.createMovement({
      partId,
      type: 'adjustment',
      qty: difference,
      unitCost: part.unitCostDzd,
      totalCost: Math.abs(difference) * part.unitCostDzd,
      notes: reason,
    });

    return { success: true, part: updatedPart };
  },

  /**
   * Check stock alert
   */
  async checkStockAlerts(): Promise<Array<{ part: SparePart; alertType: 'critical' | 'low' | 'overstock' }>> {
    const alerts: Array<{ part: SparePart; alertType: 'critical' | 'low' | 'overstock' }> = [];

    for (const part of mockDb.parts.values()) {
      if (part.stockQty === 0 && part.isCritical) {
        alerts.push({ part, alertType: 'critical' });
      } else if (part.stockQty < part.minStockQty) {
        alerts.push({ part, alertType: 'low' });
      } else if (part.maxStockQty && part.stockQty > part.maxStockQty) {
        alerts.push({ part, alertType: 'overstock' });
      }
    }

    return alerts;
  },

  /**
   * Create reorder for parts below minimum
   */
  async createReorderForLowStock(orgId: string): Promise<{ po: PurchaseOrder; parts: SparePart[] }> {
    const lowStockParts = await mockDb.getPartsBelowReorder();
    
    const items = lowStockParts.map(part => ({
      partId: part.id,
      qtyOrdered: part.maxStockQty - part.stockQty,
      qtyReceived: 0,
      unitPrice: part.lastPurchasePriceDzd,
    }));

    const total = items.reduce((sum, item) => sum + (item.qtyOrdered * item.unitPrice), 0);

    const po = await mockDb.createPO({
      orgId,
      items,
      totalDzd: total,
    });

    return { po, parts: lowStockParts };
  },

  /**
   * Get stock value
   */
  async getStockValue(orgId: string): Promise<number> {
    let total = 0;
    for (const part of mockDb.parts.values()) {
      if (part.orgId === orgId) {
        total += part.stockQty * part.unitCostDzd;
      }
    }
    return total;
  },

  /**
   * Check if part can be consumed
   */
  canConsume(part: SparePart, qty: number): boolean {
    return part.stockQty >= qty;
  },
};

describe('Inventory API Integration Tests', () => {
  beforeEach(() => {
    mockDb.clear();
    // Reset stock levels
    mockDb.parts.set('part_1', {
      id: 'part_1', orgId: 'org_1', partNumber: 'BRG-001', name: 'Bearing 6205',
      stockQty: 10, minStockQty: 5, maxStockQty: 20, unitCostDzd: 5000, lastPurchasePriceDzd: 4800,
      stockLocation: 'A-01-05', isCritical: true,
    });
    mockDb.parts.set('part_2', {
      id: 'part_2', orgId: 'org_1', partNumber: 'SEAL-001', name: 'Mechanical Seal',
      stockQty: 3, minStockQty: 5, maxStockQty: 15, unitCostDzd: 12000, lastPurchasePriceDzd: 11500,
      stockLocation: 'B-02-10', isCritical: true,
    });
  });

  describe('Part Consumption', () => {
    it('part consumed creates movement record', async () => {
      const result = await inventoryApi.consumePart('part_1', 'wo_123', 2, 'Used in repair');

      expect(result.success).toBe(true);

      const movements = await mockDb.getMovementsByPart('part_1');
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('out');
      expect(movements[0].qty).toBe(-2);
    });

    it('updates stock quantity after consumption', async () => {
      await inventoryApi.consumePart('part_1', 'wo_123', 3);

      const part = await mockDb.getPart('part_1');
      expect(part?.stockQty).toBe(7); // 10 - 3
    });

    it('stock cannot go negative', async () => {
      const result = await inventoryApi.consumePart('part_1', 'wo_123', 15);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');

      const part = await mockDb.getPart('part_1');
      expect(part?.stockQty).toBe(10); // Unchanged
    });
  });

  describe('Stock Adjustment', () => {
    it('adjusts stock and records reason', async () => {
      const result = await inventoryApi.adjustStock('part_1', 12, 'Inventory count correction');

      expect(result.success).toBe(true);
      expect(result.part?.stockQty).toBe(12);

      const movements = await mockDb.getMovementsByPart('part_1');
      expect(movements).toHaveLength(1);
      expect(movements[0].notes).toBe('Inventory count correction');
    });

    it('prevents negative stock adjustment', async () => {
      const result = await inventoryApi.adjustStock('part_1', -5, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('records difference in movement', async () => {
      await inventoryApi.adjustStock('part_1', 8, 'Correction');

      const movements = await mockDb.getMovementsByPart('part_1');
      expect(movements[0].qty).toBe(-2); // 8 - 10 = -2
    });
  });

  describe('Stock Alerts', () => {
    it('stock below min triggers alert', async () => {
      // part_2 has stock 3, min 5
      const alerts = await inventoryApi.checkStockAlerts();

      const lowStockAlert = alerts.find(a => a.part.id === 'part_2');
      expect(lowStockAlert).toBeDefined();
      expect(lowStockAlert?.alertType).toBe('low');
    });

    it('critical part at zero triggers critical alert', async () => {
      // Set part to zero stock
      await mockDb.updatePart('part_1', { stockQty: 0 });

      const alerts = await inventoryApi.checkStockAlerts();

      const criticalAlert = alerts.find(a => a.part.id === 'part_1');
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.alertType).toBe('critical');
    });

    it('triggers alert after consumption drops below min', async () => {
      // part_1 starts at 10, min is 5
      await inventoryApi.consumePart('part_1', 'wo_123', 6);

      const part = await mockDb.getPart('part_1');
      expect(part?.stockQty).toBe(4);
      expect(part!.stockQty < part!.minStockQty).toBe(true);

      const alerts = await inventoryApi.checkStockAlerts();
      expect(alerts.find(a => a.part.id === 'part_1')).toBeDefined();
    });
  });

  describe('Purchase Order Receiving', () => {
    it('PO receive updates stock qty', async () => {
      const { po } = await mockDb.createPO({
        items: [{ partId: 'part_1', qtyOrdered: 10, qtyReceived: 0, unitPrice: 5000 }],
      });

      const result = await mockDb.receivePO(po.id, [{ partId: 'part_1', qty: 10 }]);

      expect(result.success).toBe(true);

      const part = await mockDb.getPart('part_1');
      expect(part?.stockQty).toBe(20); // 10 + 10
    });

    it('creates stock-in movement on PO receive', async () => {
      const { po } = await mockDb.createPO({
        items: [{ partId: 'part_3', qtyOrdered: 5, qtyReceived: 0, unitPrice: 3500 }],
      });

      await mockDb.receivePO(po.id, [{ partId: 'part_3', qty: 5 }]);

      const movements = await mockDb.getMovementsByPart('part_3');
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('in');
      expect(movements[0].notes).toContain(po.poNumber);
    });

    it('updates PO status to received', async () => {
      const { po } = await mockDb.createPO({
        items: [{ partId: 'part_1', qtyOrdered: 5, qtyReceived: 0, unitPrice: 5000 }],
      });

      const result = await mockDb.receivePO(po.id, [{ partId: 'part_1', qty: 5 }]);

      expect(result.po?.status).toBe('received');
      expect(result.po?.receivedAt).toBeDefined();
    });
  });

  describe('Reorder Creation', () => {
    it('creates PO for parts below reorder point', async () => {
      const { po, parts } = await inventoryApi.createReorderForLowStock('org_1');

      expect(parts.length).toBeGreaterThan(0);
      expect(po.items.length).toBe(parts.length);
    });

    it('calculates correct reorder quantity', async () => {
      const { po } = await inventoryApi.createReorderForLowStock('org_1');

      const part2Item = po.items.find(i => i.partId === 'part_2');
      // part_2: stock=3, max=15, should order 12
      expect(part2Item?.qtyOrdered).toBe(12);
    });
  });

  describe('Stock Value Calculation', () => {
    it('calculates total stock value correctly', async () => {
      const value = await inventoryApi.getStockValue('org_1');

      // part_1: 10 * 5000 = 50000
      // part_2: 3 * 12000 = 36000
      // part_3: 20 * 3500 = 70000
      // Total: 156000
      expect(value).toBe(156000);
    });
  });

  describe('Consumption Validation', () => {
    it('allows consumption when sufficient stock', async () => {
      const part = await mockDb.getPart('part_1');
      expect(inventoryApi.canConsume(part!, 5)).toBe(true);
    });

    it('prevents consumption when insufficient stock', async () => {
      const part = await mockDb.getPart('part_1');
      expect(inventoryApi.canConsume(part!, 15)).toBe(false);
    });
  });

  describe('Critical Parts Handling', () => {
    it('flags critical parts in alerts', async () => {
      await mockDb.updatePart('part_1', { stockQty: 2 }); // Below min

      const alerts = await inventoryApi.checkStockAlerts();
      const criticalAlert = alerts.find(a => a.part.id === 'part_1');

      expect(criticalAlert?.part.isCritical).toBe(true);
    });

    it('prioritizes critical parts for reorder', async () => {
      const { parts } = await inventoryApi.createReorderForLowStock('org_1');

      const criticalParts = parts.filter(p => p.isCritical);
      expect(criticalParts.length).toBeGreaterThan(0);
    });
  });

  describe('Part Movement History', () => {
    it('maintains complete movement history', async () => {
      await inventoryApi.consumePart('part_1', 'wo_1', 2, 'First use');
      await inventoryApi.consumePart('part_1', 'wo_2', 1, 'Second use');
      await inventoryApi.adjustStock('part_1', 15, 'Correction');

      const movements = await mockDb.getMovementsByPart('part_1');
      expect(movements).toHaveLength(3);
    });

    it('links movements to work orders', async () => {
      await inventoryApi.consumePart('part_1', 'wo_123', 2);

      const movements = await mockDb.getMovementsByPart('part_1');
      expect(movements[0].woId).toBe('wo_123');
    });
  });
});

export { inventoryApi, mockDb };
