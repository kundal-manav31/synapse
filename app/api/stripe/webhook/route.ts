import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

// Stripe requires the raw body for signature verification — disable Next.js body parsing
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] Signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const svc = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0].price.id;
        const tier = priceId === process.env.STRIPE_TEAM_PRICE_ID ? 'team' : 'pro';

        await svc
          .from('profiles')
          .update({
            subscription_tier: tier,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        // Ignore if subscription is scheduled to cancel but still active
        if (sub.status !== 'active' && sub.status !== 'trialing') break;

        const priceId = sub.items.data[0].price.id;
        const tier = priceId === process.env.STRIPE_TEAM_PRICE_ID ? 'team' : 'pro';

        await svc
          .from('profiles')
          .update({ subscription_tier: tier, updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', sub.customer as string);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await svc
          .from('profiles')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', sub.customer as string);
        break;
      }

      case 'invoice.payment_failed': {
        // Log for monitoring — do not downgrade immediately on first failure;
        // Stripe will retry. Downgrade happens on subscription.deleted.
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('[webhook] Payment failed for customer', invoice.customer);
        break;
      }

      default:
        // Unhandled event type — return 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    console.error('[webhook] Handler error', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
