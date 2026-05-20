import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isLSConfigured } from '@/lib/lemonsqueezy';

export async function POST() {
  if (!isLSConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = createServiceClient();
    const { data: profile } = await svc
      .from('profiles')
      .select('ls_portal_url')
      .eq('id', user.id)
      .single();

    // Fall back to the generic LS customer portal if we don't have a specific URL
    const url = profile?.ls_portal_url ?? 'https://app.lemonsqueezy.com/my-orders';
    return NextResponse.json({ url });
  } catch (err) {
    console.error('[ls/portal]', err);
    return NextResponse.json({ error: 'Failed to open portal' }, { status: 500 });
  }
}
