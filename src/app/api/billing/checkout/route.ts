import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/pricing.config';

// POST /api/billing/checkout - Create a checkout session (Stripe placeholder)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, annualBilling } = body;

    const org = await db.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const plan = PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // For Enterprise plan, redirect to contact sales
    if (planId === 'enterprise') {
      return NextResponse.json({
        type: 'contact_sales',
        message: 'Please contact our sales team for Enterprise pricing.',
        email: 'sales@gmao-pro.dz',
      });
    }

    const price = annualBilling ? plan.priceAnnual : plan.priceMonthly;

    // In production, this would create a Stripe checkout session
    // For now, we'll create/update the subscription directly
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);

    const subscription = await db.subscription.upsert({
      where: { orgId: org.id },
      create: {
        orgId: org.id,
        planId,
        status: 'trialing',
        trialEndsAt,
        monthlyPriceEur: price,
        annualBilling,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
      },
      update: {
        planId,
        status: 'trialing',
        trialEndsAt,
        monthlyPriceEur: price,
        annualBilling,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
      },
    });

    // In production with Stripe:
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price: annualBilling ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly,
    //     quantity: 1,
    //   }],
    //   mode: 'subscription',
    //   success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    // });

    return NextResponse.json({
      type: 'trial',
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
      },
      message: `Your ${plan.trialDays}-day trial has started. Enjoy GMAO Pro!`,
      // In production: checkoutUrl: session.url
    });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
