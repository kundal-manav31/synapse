import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { calculateElo, calculateCompositeScore } from '@/lib/elo';
import { generateDailyPuzzle } from '@/lib/puzzle-generator';
import type { SubmitScoreRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubmitScoreRequest = await req.json();
    const { memory, speed, pattern, math, stroop, completion_time_ms } = body;

    // Validate domain scores
    for (const [key, val] of Object.entries({ memory, speed, pattern, math, stroop })) {
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 100) {
        return NextResponse.json({ error: `Invalid ${key} score` }, { status: 400 });
      }
    }
    // Reject implausibly fast or slow completion times
    if (
      typeof completion_time_ms !== 'number' ||
      completion_time_ms < 20_000 ||
      completion_time_ms > 600_000
    ) {
      return NextResponse.json({ error: 'Invalid completion time' }, { status: 400 });
    }

    // Use UTC date so every player worldwide gets the same puzzle date
    const today = new Date().toISOString().split('T')[0];
    const svc = createServiceClient();

    // Idempotency: one submission per user per day
    const { data: existing } = await svc
      .from('game_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('puzzle_date', today)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already submitted today' }, { status: 409 });
    }

    // Ensure today's puzzle row exists (create it if the daily-puzzle endpoint wasn't called first)
    let { data: puzzle } = await svc
      .from('daily_puzzles')
      .select('id')
      .eq('puzzle_date', today)
      .maybeSingle();

    if (!puzzle) {
      const config = generateDailyPuzzle(today);
      const { data: newPuzzle, error: puzzleError } = await svc
        .from('daily_puzzles')
        .insert({ puzzle_date: today, seed: config.seed, difficulty: 5 })
        .select('id')
        .single();
      if (puzzleError) throw puzzleError;
      puzzle = newPuzzle;
    }

    // Fetch user's current ELO and streak data
    const { data: profile, error: profileError } = await svc
      .from('profiles')
      .select('elo, streak_current, streak_longest, last_played_date')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const totalScore = calculateCompositeScore({ memory, speed, pattern, math, stroop });
    const { newElo, eloChange } = calculateElo(profile.elo, totalScore);

    // Insert the game session
    const { data: session, error: insertError } = await svc
      .from('game_sessions')
      .insert({
        user_id: user.id,
        puzzle_id: puzzle.id,
        puzzle_date: today,
        memory_score: memory,
        speed_score: speed,
        pattern_score: pattern,
        math_score: math,
        stroop_score: stroop,
        total_score: totalScore,
        elo_before: profile.elo,
        elo_after: newElo,
        elo_change: eloChange,
        completion_time_ms,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Rank: count players who scored strictly higher than me today
    const { count: betterCount } = await svc
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('puzzle_date', today)
      .gt('total_score', totalScore);

    // Total players who submitted today (including me)
    const { count: totalCount } = await svc
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('puzzle_date', today);

    const globalRank = (betterCount ?? 0) + 1;
    // "Top X%" — lower is better. rank 1 of 100 = top 1%.
    const percentile = Math.max(
      1,
      Math.round((globalRank / Math.max(1, totalCount ?? 1)) * 100)
    );

    // Persist rank back to the session row
    await svc
      .from('game_sessions')
      .update({ global_rank: globalRank, percentile })
      .eq('id', session.id);

    // Streak logic (UTC dates)
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (profile.last_played_date === yesterdayStr) {
      newStreak = profile.streak_current + 1;
    }
    const newLongest = Math.max(newStreak, profile.streak_longest);

    await svc
      .from('profiles')
      .update({
        elo: newElo,
        streak_current: newStreak,
        streak_longest: newLongest,
        last_played_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      session: { ...session, global_rank: globalRank, percentile },
      // Flat scores object so the results page can read result.scores directly
      scores: { memory, speed, pattern, math, stroop },
      total_score: totalScore,
      elo_before: profile.elo,
      elo_after: newElo,
      elo_change: eloChange,
      global_rank: globalRank,
      percentile,
      streak: newStreak,
    });
  } catch (err) {
    console.error('[submit-score]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
