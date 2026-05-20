import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') || url.startsWith('http://');
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ entries: [], myEntry: null });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);

  try {
    const svc = createServiceClient();

    const { data, error } = await svc
      .from('daily_leaderboard')
      .select('*')
      .eq('puzzle_date', date)
      .order('total_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // If the user is authenticated, also return their own entry so we can
    // highlight them even if they're outside the top 100.
    let myEntry = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mySession } = await svc
          .from('game_sessions')
          .select(`
            total_score, global_rank, percentile, elo_after,
            profiles!inner(username, display_name, avatar_url, streak_current)
          `)
          .eq('user_id', user.id)
          .eq('puzzle_date', date)
          .maybeSingle();

        if (mySession) {
          const p = (mySession.profiles as unknown as Record<string, unknown>);
          myEntry = {
            puzzle_date: date,
            total_score: mySession.total_score,
            global_rank: mySession.global_rank,
            percentile: mySession.percentile,
            elo: mySession.elo_after,
            username: p.username as string,
            display_name: p.display_name as string | null,
            avatar_url: p.avatar_url as string | null,
            streak_current: p.streak_current as number,
          };
        }
      }
    } catch {
      // Non-fatal — auth check failed, proceed without myEntry
    }

    return NextResponse.json({ entries: data ?? [], myEntry });
  } catch (err) {
    console.error('[leaderboard]', err);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
