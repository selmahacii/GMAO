import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const org = await db.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const [
      totalAssets,
      operationalAssets,
      workOrdersInProgress,
      workOrdersCompleted,
      workOrdersThisMonth,
      criticalAlerts,
      lowStockParts,
      technicians,
    ] = await Promise.all([
      db.asset.count({ where: { orgId: org.id } }),
      db.asset.count({ where: { orgId: org.id, status: 'operational' } }),
      db.workOrder.count({ where: { orgId: org.id, status: { in: ['draft', 'planned', 'assigned', 'in_progress'] } } }),
      db.workOrder.count({ where: { orgId: org.id, status: { in: ['completed', 'validated'] } } }),
      db.workOrder.count({
        where: {
          orgId: org.id,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      db.alert.count({ where: { orgId: org.id, severity: 'critical', resolvedAt: null } }),
      db.sparePart.count({ where: { orgId: org.id, stockQty: { lte: db.sparePart.fields.minStockQty } } }),
      db.user.count({ where: { orgId: org.id, role: 'technician', active: true } }),
    ]);

    const woByType = await db.workOrder.groupBy({
      by: ['woType'],
      where: { orgId: org.id },
      _count: { id: true },
    });

    const woByStatus = await db.workOrder.groupBy({
      by: ['status'],
      where: { orgId: org.id },
      _count: { id: true },
    });

    const assets = await db.asset.findMany({
      where: { orgId: org.id, mtbfHours: { not: null } },
      select: { mtbfHours: true, mttrHours: true, availabilityPct: true },
    });

    const avgMTBF = assets.length > 0 ? assets.reduce((sum, a) => sum + (a.mtbfHours || 0), 0) / assets.length : 0;
    const avgMTTR = assets.length > 0 ? assets.reduce((sum, a) => sum + (a.mttrHours || 0), 0) / assets.length : 0;
    const avgAvailability = assets.length > 0 ? assets.reduce((sum, a) => sum + (a.availabilityPct || 0), 0) / assets.length : 0;

    const woCosts = await db.workOrder.findMany({
      where: { orgId: org.id, completedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, actualCostDzd: { not: null } },
      select: { actualCostDzd: true },
    });
    const monthlyCost = woCosts.reduce((sum, wo) => sum + (wo.actualCostDzd || 0), 0);

    const pmWorkOrders = await db.workOrder.count({ where: { orgId: org.id, woType: 'preventive' } });
    const pmCompletedOnTime = await db.workOrder.count({
      where: { orgId: org.id, woType: 'preventive', slaBreached: false, status: { in: ['completed', 'validated'] } },
    });
    const pmCompliance = pmWorkOrders > 0 ? (pmCompletedOnTime / pmWorkOrders) * 100 : 0;

    const recentAlerts = await db.alert.findMany({
      where: { orgId: org.id },
      orderBy: { triggeredAt: 'desc' },
      take: 5,
      include: { asset: { select: { name: true } } },
    });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const workOrdersByMonth = await db.workOrder.groupBy({
      by: ['woType', 'createdAt'],
      where: { orgId: org.id, createdAt: { gte: twelveMonthsAgo } },
    });

    const monthData: Record<string, { corrective: number; preventive: number }> = {};
    workOrdersByMonth.forEach(wo => {
      const month = wo.createdAt.toISOString().substring(0, 7);
      if (!monthData[month]) monthData[month] = { corrective: 0, preventive: 0 };
      if (wo.woType === 'corrective') monthData[month].corrective++;
      else if (wo.woType === 'preventive') monthData[month].preventive++;
    });

    const topAssetsByDowntime = await db.workOrder.groupBy({
      by: ['assetId'],
      where: { orgId: org.id, assetId: { not: null }, downtimeHours: { not: null } },
      _sum: { downtimeHours: true },
      orderBy: { _sum: { downtimeHours: 'desc' } },
      take: 5,
    });

    const assetIds = topAssetsByDowntime.map(a => a.assetId).filter(Boolean) as string[];
    const assetNames = await db.asset.findMany({ where: { id: { in: assetIds } }, select: { id: true, name: true } });
    const assetNameMap = new Map(assetNames.map(a => [a.id, a.name]));

    const failureModes = await db.workOrder.groupBy({
      by: ['failureCategory'],
      where: { orgId: org.id, failureCategory: { not: null } },
      _count: { id: true },
    });

    const upcomingPMs = await db.workOrder.findMany({
      where: { orgId: org.id, woType: 'preventive', status: { in: ['planned', 'assigned'] }, plannedStartAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      include: { asset: { select: { name: true, assetTag: true } } },
      orderBy: { plannedStartAt: 'asc' },
      take: 5,
    });

    const technicianWorkload = await db.workOrder.groupBy({
      by: ['assignedToId'],
      where: { orgId: org.id, status: { in: ['assigned', 'in_progress'] }, assignedToId: { not: null } },
      _sum: { estimatedDurationHours: true },
      _count: { id: true },
    });

    const technicianIds = technicianWorkload.map(t => t.assignedToId).filter(Boolean) as string[];
    const technicianNames = await db.user.findMany({ where: { id: { in: technicianIds } }, select: { id: true, fullName: true } });
    const technicianNameMap = new Map(technicianNames.map(t => [t.id, t.fullName]));

    return NextResponse.json({
      kpis: {
        availability: avgAvailability.toFixed(1),
        mtbf: Math.round(avgMTBF),
        mttr: avgMTTR.toFixed(1),
        workOrdersInProgress,
        workOrdersCompleted,
        workOrdersThisMonth,
        pmCompliance: pmCompliance.toFixed(0),
        monthlyCost: Math.round(monthlyCost),
        criticalAlerts,
        lowStockParts,
        totalAssets,
        operationalAssets,
        technicians,
        currency: 'DZD',
      },
      woByType: woByType.map(w => ({ type: w.woType, count: w._count.id })),
      woByStatus: woByStatus.map(w => ({ status: w.status, count: w._count.id })),
      workOrdersByMonth: Object.entries(monthData).map(([month, data]) => ({ month, ...data })),
      topDowntimeAssets: topAssetsByDowntime.map(a => ({
        assetId: a.assetId,
        name: assetNameMap.get(a.assetId!) || 'Unknown',
        downtimeHours: a._sum.downtimeHours || 0,
      })),
      failureModes: failureModes.map(f => ({ category: f.failureCategory, count: f._count.id })),
      recentAlerts: recentAlerts.map(a => ({
        id: a.id, type: a.alertType, severity: a.severity, title: a.title, message: a.message,
        assetName: a.asset?.name, triggeredAt: a.triggeredAt,
      })),
      upcomingPMs: upcomingPMs.map(p => ({
        id: p.id, woNumber: p.woNumber, title: p.title, assetName: p.asset?.name, assetTag: p.asset?.assetTag, plannedStartAt: p.plannedStartAt,
      })),
      technicianWorkload: technicianWorkload.map(t => ({
        userId: t.assignedToId, name: technicianNameMap.get(t.assignedToId!) || 'Unknown',
        hours: t._sum.estimatedDurationHours || 0, workOrders: t._count.id,
      })),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
