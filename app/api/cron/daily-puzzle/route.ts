import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { generateDailyPuzzle } from '@/lib/puzzle-generator';

// Called by Vercel Cron at 23:50 UTC every day.
// Pre-generates tomorrow's puzzle row so the first player of the day
// never has to wait for a cold INSERT.
export async function GET(req: NextRequest) {
  // Vercel cron jobs send: Authorization: Bearer {CRON_SECRET}
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const date = tomorrow.toISOString().split('T')[0];

  const config = generateDailyPuzzle(date);
  const svc = createServiceClient();

  const { error } = await svc
    .from('daily_puzzles')
    .upsert(
      { puzzle_date: date, seed: config.seed, difficulty: 5 },
      { onConflict: 'puzzle_date', ignoreDuplicates: true }
    );

  if (error) {
    console.error('[cron/daily-puzzle]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[cron] Pre-generated puzzle for ${date} (seed: ${config.seed})`);
  return NextResponse.json({ ok: true, date, seed: config.seed });
}
