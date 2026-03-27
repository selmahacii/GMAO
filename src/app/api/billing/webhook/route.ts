import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Stripe webhook handler
// Handles events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // In production, verify webhook signature
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    // For development, parse the body directly
    const event = JSON.parse(body);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(session: Record<string, unknown>) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const metadata = session.metadata as Record<string, string> || {};
  
  const orgId = metadata.orgId;
  const planId = metadata.planId;

  if (!orgId) return;

  // Create or update subscription
  await db.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      planId: planId || 'starter',
      status: 'active',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    update: {
      planId: planId || 'starter',
      status: 'active',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Checkout completed for org ${orgId}, plan: ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Record<string, unknown>) {
  const subscriptionId = subscription.id as string;
  const customerId = subscription.customer as string;
  const status = subscription.status as string;
  const currentPeriodStart = subscription.current_period_start as number;
  const currentPeriodEnd = subscription.current_period_end as number;
  
  // Find subscription by Stripe ID
  const existingSub = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existingSub) {
    // Try to find by customer ID
    const byCustomer = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });
    
    if (!byCustomer) return;
    
    await db.subscription.update({
      where: { id: byCustomer.id },
      data: {
        status: mapStripeStatus(status),
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      },
    });
  } else {
    await db.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: mapStripeStatus(status),
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      },
    });
  }

  console.log(`Subscription ${subscriptionId} updated to ${status}`);
}

async function handleSubscriptionDeleted(subscription: Record<string, unknown>) {
  const subscriptionId = subscription.id as string;
  
  const existingSub = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (existingSub) {
    await db.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });
  }

  console.log(`Subscription ${subscriptionId} cancelled`);
}

async function handleInvoicePaid(invoice: Record<string, unknown>) {
  const invoiceId = invoice.id as string;
  const customerId = invoice.customer as string;
  const amountPaid = invoice.amount_paid as number;
  const currency = invoice.currency as string;
  
  // Find subscription by customer ID
  const sub = await db.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (sub) {
    // Create invoice record
    await db.invoice.create({
      data: {
        orgId: sub.orgId,
        subscriptionId: sub.id,
        stripeInvoiceId: invoiceId,
        status: 'paid',
        amountEur: amountPaid / 100, // Convert from cents
        currency: currency.toUpperCase(),
        paidAt: new Date(),
      },
    });

    // Update subscription status if it was past_due
    if (sub.status === 'past_due') {
      await db.subscription.update({
        where: { id: sub.id },
        data: { status: 'active' },
      });
    }
  }

  console.log(`Invoice ${invoiceId} paid: ${amountPaid} ${currency}`);
}

async function handleInvoicePaymentFailed(invoice: Record<string, unknown>) {
  const customerId = invoice.customer as string;
  
  const sub = await db.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (sub) {
    // Mark subscription as past due
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: 'past_due' },
    });

    // Create failed invoice record
    await db.invoice.create({
      data: {
        orgId: sub.orgId,
        subscriptionId: sub.id,
        stripeInvoiceId: invoice.id as string,
        status: 'open',
        amountEur: (invoice.amount_due as number) / 100,
        currency: (invoice.currency as string).toUpperCase(),
      },
    });
  }

  console.log(`Payment failed for customer ${customerId}`);
}

function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'cancelled',
    'unpaid': 'past_due',
    'trialing': 'trialing',
    'incomplete': 'draft',
    'incomplete_expired': 'expired',
  };
  return statusMap[stripeStatus] || 'active';
}

// GET endpoint to verify webhook is working
export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
