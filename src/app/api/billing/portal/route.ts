import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/billing/portal - Create Stripe customer portal session
export async function POST() {
  try {
    const org = await db.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const subscription = await db.subscription.findUnique({
      where: { orgId: org.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No Stripe customer found. Please complete checkout first.',
      }, { status: 400 });
    }

    // In production, create a Stripe billing portal session
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: subscription.stripeCustomerId,
    //   return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    // });

    // For development, return a mock portal URL
    const mockPortalUrl = `https://billing.stripe.com/p/login/test_${subscription.stripeCustomerId}`;

    return NextResponse.json({
      url: mockPortalUrl,
      message: 'Customer portal session created',
      customerId: subscription.stripeCustomerId,
    });
  } catch (error) {
    console.error('Portal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/billing/portal - Get portal configuration
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
          where: { status: 'paid' },
          orderBy: { paidAt: 'desc' },
          take: 5,
        },
      },
    });

    // Portal features available
    const portalFeatures = {
      canUpdatePaymentMethod: true,
      canViewInvoices: true,
      canCancelSubscription: true,
      canUpdatePlan: true,
      canDownloadInvoices: true,
    };

    return NextResponse.json({
      hasActiveSubscription: !!subscription?.stripeSubscriptionId,
      customerId: subscription?.stripeCustomerId,
      features: portalFeatures,
      recentInvoices: subscription?.invoices.map(inv => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amountEur,
        currency: inv.currency,
        paidAt: inv.paidAt,
        pdfUrl: inv.pdfUrl,
      })) || [],
    });
  } catch (error) {
    console.error('Portal config API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
