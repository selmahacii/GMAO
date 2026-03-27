import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock') === 'true';
    const critical = searchParams.get('critical') === 'true';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const where: any = { orgId: org.id };
    if (category) where.category = category;
    if (critical) where.isCritical = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { partNumber: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (lowStock) {
      where.stockQty = { lte: db.sparePart.fields.minStockQty };
    }

    const [parts, total] = await Promise.all([
      db.sparePart.findMany({
        where,
        include: {
          supplier: { select: { name: true } },
          _count: { select: { movements: true } },
        },
        orderBy: [{ isCritical: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.sparePart.count({ where }),
    ]);

    const partsWithStatus = parts.map(p => ({
      ...p,
      stockStatus: p.stockQty <= 0 ? 'out' : p.stockQty <= p.minStockQty * 0.5 ? 'critical' : p.stockQty <= p.minStockQty ? 'low' : 'ok',
      stockValue: p.stockQty * (p.unitCostEur || 0),
    }));

    const totalValue = partsWithStatus.reduce((sum, p) => sum + p.stockValue, 0);

    return NextResponse.json({ parts: partsWithStatus, total, page, limit, totalPages: Math.ceil(total / limit), totalValue });
  } catch (error) {
    console.error('Parts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/parts - Create new spare part
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    // Check if part number already exists
    const existing = await db.sparePart.findFirst({
      where: { orgId: org.id, partNumber: body.partNumber },
    });

    if (existing) {
      return NextResponse.json({ error: 'Part number already exists' }, { status: 400 });
    }

    const site = await db.site.findFirst({ where: { orgId: org.id } });

    const part = await db.sparePart.create({
      data: {
        orgId: org.id,
        siteId: body.siteId || site?.id,
        partNumber: body.partNumber,
        manufacturerPartNumber: body.manufacturerPartNumber,
        barcode: body.barcode,
        name: body.name,
        description: body.description,
        category: body.category || 'other',
        unit: body.unit || 'pcs',
        unitCostEur: body.unitCostEur ? parseFloat(body.unitCostEur) : null,
        lastPurchasePrice: body.lastPurchasePrice ? parseFloat(body.lastPurchasePrice) : null,
        stockQty: parseFloat(body.stockQty) || 0,
        minStockQty: parseFloat(body.minStockQty) || 0,
        maxStockQty: body.maxStockQty ? parseFloat(body.maxStockQty) : null,
        reorderQty: body.reorderQty ? parseFloat(body.reorderQty) : null,
        stockLocation: body.stockLocation,
        leadTimeDays: body.leadTimeDays ? parseInt(body.leadTimeDays) : null,
        preferredSupplierId: body.preferredSupplierId,
        isCritical: body.isCritical === true,
      },
      include: {
        supplier: { select: { name: true } },
      },
    });

    // Create initial stock movement if stock > 0
    if (part.stockQty > 0) {
      await db.sparePartMovement.create({
        data: {
          partId: part.id,
          type: 'in',
          qty: part.stockQty,
          unitCost: part.unitCostEur,
          totalCost: part.stockQty * (part.unitCostEur || 0),
          notes: 'Initial stock',
        },
      });
    }

    return NextResponse.json({
      ...part,
      stockStatus: 'ok',
      stockValue: part.stockQty * (part.unitCostEur || 0),
    }, { status: 201 });
  } catch (error) {
    console.error('Create part error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/parts - Update spare part
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Part ID required' }, { status: 400 });
    }

    const part = await db.sparePart.update({
      where: { id },
      data: {
        partNumber: data.partNumber,
        manufacturerPartNumber: data.manufacturerPartNumber,
        barcode: data.barcode,
        name: data.name,
        description: data.description,
        category: data.category,
        unit: data.unit,
        unitCostEur: data.unitCostEur ? parseFloat(data.unitCostEur) : null,
        lastPurchasePrice: data.lastPurchasePrice ? parseFloat(data.lastPurchasePrice) : null,
        stockQty: data.stockQty !== undefined ? parseFloat(data.stockQty) : undefined,
        minStockQty: data.minStockQty !== undefined ? parseFloat(data.minStockQty) : undefined,
        maxStockQty: data.maxStockQty ? parseFloat(data.maxStockQty) : null,
        reorderQty: data.reorderQty ? parseFloat(data.reorderQty) : null,
        stockLocation: data.stockLocation,
        leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : null,
        preferredSupplierId: data.preferredSupplierId,
        isCritical: data.isCritical,
      },
      include: {
        supplier: { select: { name: true } },
      },
    });

    return NextResponse.json({
      ...part,
      stockStatus: part.stockQty <= 0 ? 'out' : part.stockQty <= part.minStockQty * 0.5 ? 'critical' : part.stockQty <= part.minStockQty ? 'low' : 'ok',
      stockValue: part.stockQty * (part.unitCostEur || 0),
    });
  } catch (error) {
    console.error('Update part error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/parts - Delete spare part
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Part ID required' }, { status: 400 });
    }

    // Check if part has movements
    const movements = await db.sparePartMovement.count({
      where: { partId: id },
    });

    if (movements > 0) {
      // Soft delete by setting stock to 0 and marking as inactive
      return NextResponse.json({ error: 'Cannot delete part with movement history' }, { status: 400 });
    }

    await db.sparePart.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete part error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
