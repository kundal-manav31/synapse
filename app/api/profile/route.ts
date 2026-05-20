import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') || url.startsWith('http://');
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = createServiceClient();

    const { data: profile, error: profileError } = await svc
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    // Last 30 sessions for ELO history + domain scores
    const { data: sessions } = await svc
      .from('game_sessions')
      .select('puzzle_date, elo_after, elo_change, total_score, memory_score, speed_score, pattern_score, math_score, stroop_score')
      .eq('user_id', user.id)
      .order('puzzle_date', { ascending: true })
      .limit(30);

    // Personal bests per domain
    const personalBests = { memory: 0, speed: 0, pattern: 0, math: 0, stroop: 0 };
    for (const s of sessions ?? []) {
      if ((s.memory_score ?? 0) > personalBests.memory)  personalBests.memory  = s.memory_score ?? 0;
      if ((s.speed_score   ?? 0) > personalBests.speed)  personalBests.speed   = s.speed_score  ?? 0;
      if ((s.pattern_score ?? 0) > personalBests.pattern) personalBests.pattern = s.pattern_score ?? 0;
      if ((s.math_score    ?? 0) > personalBests.math)   personalBests.math    = s.math_score   ?? 0;
      if ((s.stroop_score  ?? 0) > personalBests.stroop) personalBests.stroop  = s.stroop_score ?? 0;
    }

    // Played dates in the last 91 days (13-week calendar)
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 91);
    const { data: calSessions } = await svc
      .from('game_sessions')
      .select('puzzle_date')
      .eq('user_id', user.id)
      .gte('puzzle_date', cutoff.toISOString().split('T')[0]);

    const playedDates = (calSessions ?? []).map((s: { puzzle_date: string }) => s.puzzle_date);

    return NextResponse.json({
      profile,
      sessions: sessions ?? [],
      personalBests,
      playedDates,
    });
  } catch (err) {
    console.error('[profile]', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
