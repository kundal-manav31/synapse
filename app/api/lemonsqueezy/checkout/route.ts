import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isLSConfigured, lsRequest } from '@/lib/lemonsqueezy';

export async function POST(req: NextRequest) {
  if (!isLSConfigured()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as { plan?: string; variantId?: string };

    let variantId: string | undefined;
    if (body.variantId) {
      variantId = body.variantId;
    } else if (body.plan === 'team') {
      variantId = process.env.LS_TEAM_VARIANT_ID;
    } else {
      variantId = process.env.LS_PRO_VARIANT_ID;
    }

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID not configured' }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const res = await lsRequest('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: { user_id: user.id },
            },
            product_options: {
              redirect_url: `${appUrl}/profile?upgraded=true`,
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: process.env.LS_STORE_ID },
            },
            variant: {
              data: { type: 'variants', id: variantId },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[ls/checkout]', err);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    const data = await res.json() as { data: { attributes: { url: string } } };
    return NextResponse.json({ url: data.data.attributes.url });
  } catch (err) {
    console.error('[ls/checkout]', err);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
