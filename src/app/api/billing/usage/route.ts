import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/pricing.config';

// GET /api/billing/usage - Get current period usage vs limits
export async function GET() {
  try {
    const org = await db.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get subscription and plan
    const subscription = await db.subscription.findUnique({
      where: { orgId: org.id },
    });

    const planId = subscription?.planId || 'starter';
    const plan = PLANS.find(p => p.id === planId) || PLANS[0];

    // Get current usage
    const currentMonth = new Date();
    const periodStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const [assetsCount, usersCount, sensorsCount] = await Promise.all([
      db.asset.count({ where: { orgId: org.id } }),
      db.user.count({ where: { orgId: org.id } }),
      db.ioTSensor.count({ where: { orgId: org.id, active: true } }),
    ]);

    const workOrdersThisMonth = await db.workOrder.count({
      where: {
        orgId: org.id,
        createdAt: { gte: periodStart },
      },
    });

    const [sitesCount] = await Promise.all([
      db.site.count({ where: { orgId: org.id } }),
    ]);

    // Calculate usage percentages and check limits
    const checkLimit = (current: number, limit: number) => {
      if (limit === -1) return { used: current, limit: -1, percentage: 0, exceeded: false };
      return {
        used: current,
        limit,
        percentage: Math.round((current / limit) * 100),
        exceeded: current >= limit,
      };
    };

    const usage = {
      sites: checkLimit(sitesCount, plan.limits.sites),
      assets: checkLimit(assetsCount, plan.limits.assets),
      users: checkLimit(usersCount, plan.limits.users),
      workOrdersThisMonth: checkLimit(workOrdersThisMonth, plan.limits.workOrdersPerMonth),
      sensors: checkLimit(sensorsCount, plan.limits.sensors),
    };

    // Check if any limits are exceeded
    const limitsExceeded = Object.entries(usage)
      .filter(([_, v]) => v.exceeded)
      .map(([k, _]) => k);

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
      },
      usage,
      limitsExceeded,
      canCreate: {
        site: !usage.sites.exceeded,
        asset: !usage.assets.exceeded,
        user: !usage.users.exceeded,
        workOrder: !usage.workOrdersThisMonth.exceeded,
        sensor: !usage.sensors.exceeded,
      },
      warningThresholds: {
        sites: usage.sites.percentage >= 80,
        assets: usage.assets.percentage >= 80,
        users: usage.users.percentage >= 80,
        workOrders: usage.workOrdersThisMonth.percentage >= 80,
        sensors: usage.sensors.percentage >= 80,
      },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
