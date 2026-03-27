import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/billing/subscription - Get current organization subscription and usage
export async function GET() {
  try {
    const org = await db.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const subscription = await db.subscription.findUnique({
      where: { orgId: org.id },
      include: {
        invoices: {
          where: { status: 'open' },
          orderBy: { dueDate: 'asc' },
          take: 5,
        },
      },
    });

    // Get current usage
    const currentMonth = new Date();
    const periodStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const periodEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const [assetsCount, usersCount, workOrdersCount, sensorsCount] = await Promise.all([
      db.asset.count({ where: { orgId: org.id } }),
      db.user.count({ where: { orgId: org.id } }),
      db.workOrder.count({
        where: {
          orgId: org.id,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      db.ioTSensor.count({ where: { orgId: org.id, active: true } }),
    ]);

    // Get or create usage record for current period
    let usageRecord = await db.usageRecord.findUnique({
      where: { orgId_periodStart: { orgId: org.id, periodStart } },
    });

    if (!usageRecord) {
      usageRecord = await db.usageRecord.create({
        data: {
          orgId: org.id,
          periodStart,
          periodEnd,
          workOrdersCount,
          assetsCount,
          usersCount,
          sensorsActive: sensorsCount,
        },
      });
    } else {
      // Update with current counts
      usageRecord = await db.usageRecord.update({
        where: { id: usageRecord.id },
        data: {
          workOrdersCount,
          assetsCount,
          usersCount,
          sensorsActive: sensorsCount,
        },
      });
    }

    return NextResponse.json({
      subscription: subscription ? {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        seatsPurchased: subscription.seatsPurchased,
        monthlyPriceEur: subscription.monthlyPriceEur,
        annualBilling: subscription.annualBilling,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : null,
      usage: {
        assets: assetsCount,
        users: usersCount,
        workOrdersThisMonth: workOrdersCount,
        sensorsActive: sensorsCount,
        periodStart,
        periodEnd,
      },
      openInvoices: subscription?.invoices.map(inv => ({
        id: inv.id,
        number: inv.number,
        amountEur: inv.amountEur,
        dueDate: inv.dueDate,
        status: inv.status,
      })) || [],
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
