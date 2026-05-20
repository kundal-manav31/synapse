import { NextResponse } from 'next/server';
import { generateDailyPuzzle } from '@/lib/puzzle-generator';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') || url.startsWith('http://');
}

export async function GET() {
  // Use UTC date — identical for every player worldwide on the same calendar day
  const today = new Date().toISOString().split('T')[0];

  // If Supabase isn't configured yet, return the puzzle without DB persistence.
  // This lets the UI be tested locally before credentials are set up.
  if (!isSupabaseConfigured()) {
    const puzzleConfig = generateDailyPuzzle(today);
    return NextResponse.json({
      puzzle: puzzleConfig,
      puzzleId: 'local',
      hasPlayedToday: false,
    });
  }

  try {
    const { createClient, createServiceClient } = await import('@/lib/supabase/server');
    const svc = createServiceClient();

    // Fetch (or create) today's puzzle row
    let { data: puzzle } = await svc
      .from('daily_puzzles')
      .select('id, puzzle_date, seed, difficulty')
      .eq('puzzle_date', today)
      .maybeSingle();

    if (!puzzle) {
      const config = generateDailyPuzzle(today);

      // upsert handles race condition: two simultaneous first-player requests
      const { data: upserted, error } = await svc
        .from('daily_puzzles')
        .upsert(
          { puzzle_date: today, seed: config.seed, difficulty: 5 },
          { onConflict: 'puzzle_date', ignoreDuplicates: false }
        )
        .select('id, puzzle_date, seed, difficulty')
        .single();

      if (error) throw error;
      puzzle = upserted;
    }

    // Check if the authenticated user has already played today
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let hasPlayedToday = false;

    if (user) {
      const { data: existingSession } = await svc
        .from('game_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('puzzle_date', today)
        .maybeSingle();

      hasPlayedToday = !!existingSession;
    }

    return NextResponse.json({
      puzzle: generateDailyPuzzle(today, puzzle.difficulty),
      puzzleId: puzzle.id,
      hasPlayedToday,
    });
  } catch (err) {
    console.error('[daily-puzzle]', err);
    return NextResponse.json({ error: 'Failed to load puzzle' }, { status: 500 });
  }
}
