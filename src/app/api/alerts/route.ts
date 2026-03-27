import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const unacknowledged = searchParams.get('unacknowledged') === 'true';
    const unresolved = searchParams.get('unresolved') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const where: any = { orgId: org.id };
    if (severity) where.severity = severity;
    if (type) where.alertType = type;
    if (unacknowledged) where.acknowledgedAt = null;
    if (unresolved) where.resolvedAt = null;

    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        include: {
          asset: { select: { name: true, assetTag: true } },
          sensor: { select: { sensorName: true, sensorType: true } },
          workOrder: { select: { woNumber: true, title: true } },
          acknowledgedBy: { select: { fullName: true } },
        },
        orderBy: { triggeredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.alert.count({ where }),
    ]);

    const unreadCount = await db.alert.count({
      where: { orgId: org.id, acknowledgedAt: null },
    });

    return NextResponse.json({ alerts, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 });
    }

    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const user = await db.user.findFirst({ where: { orgId: org.id } });

    const updateData: any = {};
    if (action === 'acknowledge') {
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedById = user?.id;
    } else if (action === 'resolve') {
      updateData.resolvedAt = new Date();
    }

    const alert = await db.alert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Update Alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
