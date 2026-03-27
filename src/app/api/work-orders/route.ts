import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const assetId = searchParams.get('assetId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const kanban = searchParams.get('kanban') === 'true';
    const calendar = searchParams.get('calendar') === 'true';

    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const where: any = { orgId: org.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.woType = type;
    if (assetId) where.assetId = assetId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { woNumber: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (kanban) {
      const statusGroups = ['draft', 'planned', 'assigned', 'in_progress', 'on_hold', 'completed', 'validated'];
      const result: Record<string, any[]> = {};
      
      for (const s of statusGroups) {
        const workOrders = await db.workOrder.findMany({
          where: { ...where, status: s },
          include: {
            asset: { select: { name: true, assetTag: true, criticality: true } },
            assignee: { select: { fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        result[s] = workOrders;
      }
      return NextResponse.json(result);
    }

    if (calendar) {
      const start = searchParams.get('start') ? new Date(searchParams.get('start')!) : new Date();
      const end = searchParams.get('end') ? new Date(searchParams.get('end')!) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const workOrders = await db.workOrder.findMany({
        where: { ...where, plannedStartAt: { gte: start, lte: end } },
        include: {
          asset: { select: { name: true } },
        },
      });
      return NextResponse.json(workOrders);
    }

    const [workOrders, total] = await Promise.all([
      db.workOrder.findMany({
        where,
        include: {
          asset: { select: { name: true, assetTag: true, criticality: true } },
          assignee: { select: { fullName: true, avatarUrl: true } },
          requester: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.workOrder.count({ where }),
    ]);

    return NextResponse.json({ workOrders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Work Orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const lastWo = await db.workOrder.findFirst({
      where: { orgId: org.id },
      orderBy: { woNumber: 'desc' },
    });

    const woNumber = lastWo
      ? `WO-${new Date().getFullYear()}-${String(parseInt(lastWo.woNumber.split('-')[2]) + 1).padStart(5, '0')}`
      : `WO-${new Date().getFullYear()}-00001`;

    const workOrder = await db.workOrder.create({
      data: {
        orgId: org.id,
        siteId: body.siteId || (await db.site.findFirst({ where: { orgId: org.id } }))?.id || '',
        woNumber,
        woType: body.woType || 'corrective',
        title: body.title,
        description: body.description,
        symptomDescription: body.symptomDescription,
        assetId: body.assetId,
        priority: body.priority || 'P3_normal',
        status: body.status || 'draft',
        requestedById: body.requestedById || (await db.user.findFirst({ where: { orgId: org.id } }))?.id || '',
        assignedToId: body.assignedToId,
        plannedStartAt: body.plannedStartAt ? new Date(body.plannedStartAt) : null,
        plannedEndAt: body.plannedEndAt ? new Date(body.plannedEndAt) : null,
        estimatedDurationHours: body.estimatedDurationHours,
        estimatedCostEur: body.estimatedCostEur,
        checklistItems: JSON.stringify(body.checklistItems || []),
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Create Work Order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/work-orders - Update work order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Work order ID required' }, { status: 400 });
    }

    const updateData: any = {};

    // Basic fields
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.symptomDescription !== undefined) updateData.symptomDescription = data.symptomDescription;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.woType) updateData.woType = data.woType;
    if (data.assetId) updateData.assetId = data.assetId;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId || null;
    
    // Date fields
    if (data.plannedStartAt) updateData.plannedStartAt = new Date(data.plannedStartAt);
    if (data.plannedEndAt) updateData.plannedEndAt = new Date(data.plannedEndAt);
    if (data.actualStartAt) updateData.actualStartAt = new Date(data.actualStartAt);
    if (data.actualEndAt) updateData.actualEndAt = new Date(data.actualEndAt);
    
    // Numeric fields
    if (data.estimatedDurationHours !== undefined) updateData.estimatedDurationHours = parseFloat(data.estimatedDurationHours);
    if (data.actualDurationHours !== undefined) updateData.actualDurationHours = parseFloat(data.actualDurationHours);
    if (data.estimatedCostEur !== undefined) updateData.estimatedCostEur = parseFloat(data.estimatedCostEur);
    if (data.actualCostEur !== undefined) updateData.actualCostEur = parseFloat(data.actualCostEur);
    if (data.downtimeHours !== undefined) updateData.downtimeHours = parseFloat(data.downtimeHours);

    // Resolution fields
    if (data.rootCause !== undefined) updateData.rootCause = data.rootCause;
    if (data.correctiveAction !== undefined) updateData.correctiveAction = data.correctiveAction;
    if (data.technicianNotes !== undefined) updateData.technicianNotes = data.technicianNotes;
    if (data.failureMode !== undefined) updateData.failureMode = data.failureMode;
    if (data.failureCategory !== undefined) updateData.failureCategory = data.failureCategory;
    if (data.resolutionType !== undefined) updateData.resolutionType = data.resolutionType;

    // Handle status-specific updates
    if (data.status === 'completed' && !data.completedAt) {
      updateData.completedAt = new Date();
    }
    if (data.status === 'validated') {
      updateData.validatedAt = new Date();
    }

    // Checklist
    if (data.checklistItems) {
      updateData.checklistItems = JSON.stringify(data.checklistItems);
    }

    const workOrder = await db.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        asset: { select: { name: true, assetTag: true, criticality: true } },
        assignee: { select: { fullName: true, avatarUrl: true } },
        requester: { select: { fullName: true } },
      },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Update Work Order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/work-orders - Delete work order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Work order ID required' }, { status: 400 });
    }

    // Check if work order can be deleted (only draft status)
    const wo = await db.workOrder.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (wo.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft work orders can be deleted' }, { status: 400 });
    }

    await db.workOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Work Order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
