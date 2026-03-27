import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/parts/movements - Create stock movement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partId, type, qty, notes, referenceDoc, workOrderId } = body;

    if (!partId || !type || qty === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current part info
    const part = await db.sparePart.findUnique({
      where: { id: partId },
      select: { stockQty: true, unitCostDzd: true },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Calculate new quantity
    const qtyChange = type === 'out' ? -Math.abs(qty) : Math.abs(qty);
    const newQty = Math.max(0, part.stockQty + qtyChange);

    // Create movement and update stock in transaction
    const [movement] = await db.$transaction([
      db.sparePartMovement.create({
        data: {
          partId,
          woId: workOrderId,
          type,
          qty: qtyChange,
          unitCost: part.unitCostDzd,
          totalCost: part.unitCostDzd ? part.unitCostDzd * Math.abs(qty) : null,
          movedAt: new Date(),
          notes,
          referenceDoc,
        },
      }),
      db.sparePart.update({
        where: { id: partId },
        data: {
          stockQty: newQty,
          lastUsedDate: type === 'out' ? new Date() : undefined,
          totalConsumedYtd: type === 'out' 
            ? { increment: Math.abs(qty) } 
            : undefined,
        },
      }),
    ]);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Create movement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
