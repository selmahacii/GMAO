import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/pricing.config';

// GET /api/billing/plans - Return all available plans
export async function GET() {
  return NextResponse.json({
    plans: PLANS.map(plan => ({
      id: plan.id,
      name: plan.name,
      tagline: plan.tagline,
      priceMonthly: plan.priceMonthly,
      priceAnnual: plan.priceAnnual,
      currency: plan.currency,
      highlighted: plan.highlighted,
      cta: plan.cta,
      trialDays: plan.trialDays,
      limits: plan.limits,
      features: plan.features,
    })),
  });
}
