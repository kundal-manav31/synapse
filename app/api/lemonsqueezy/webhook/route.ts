import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { isLSConfigured } from '@/lib/lemonsqueezy';

export async function POST(req: NextRequest) {
  if (!isLSConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const secret = process.env.LS_WEBHOOK_SECRET ?? '';
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as {
    meta: {
      event_name: string;
      custom_data?: { user_id?: string };
    };
    data: {
      id: string;
      attributes: {
        customer_id: number;
        variant_id: number;
        status: string;
        cancelled: boolean;
        urls?: {
          customer_portal?: string;
        };
      };
    };
  };

  const event = payload.meta.event_name;
  const attrs = payload.data.attributes;
  const userId = payload.meta.custom_data?.user_id;
  const svc = createServiceClient();

  try {
    switch (event) {
      case 'subscription_created': {
        if (!userId) break;
        const variantId = String(attrs.variant_id);
        const tier = variantId === process.env.LS_TEAM_VARIANT_ID ? 'team' : 'pro';
        await svc.from('profiles').update({
          subscription_tier: tier,
          ls_customer_id: String(attrs.customer_id),
          ls_subscription_id: payload.data.id,
          ls_portal_url: attrs.urls?.customer_portal ?? null,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
        break;
      }

      case 'subscription_updated': {
        if (!userId) break;
        if (attrs.status !== 'active' && attrs.status !== 'on_trial') break;
        const variantId = String(attrs.variant_id);
        const tier = variantId === process.env.LS_TEAM_VARIANT_ID ? 'team' : 'pro';
        await svc.from('profiles').update({
          subscription_tier: tier,
          ls_portal_url: attrs.urls?.customer_portal ?? null,
          updated_at: new Date().toISOString(),
        }).eq('ls_subscription_id', payload.data.id);
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        // subscription_cancelled = cancels at period end (still active)
        // subscription_expired = fully ended, downgrade now
        if (event === 'subscription_expired') {
          await svc.from('profiles').update({
            subscription_tier: 'free',
            ls_subscription_id: null,
            ls_portal_url: null,
            updated_at: new Date().toISOString(),
          }).eq('ls_subscription_id', payload.data.id);
        }
        break;
      }

      case 'subscription_payment_failed': {
        console.warn('[ls/webhook] Payment failed for subscription', payload.data.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[ls/webhook] Handler error', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
