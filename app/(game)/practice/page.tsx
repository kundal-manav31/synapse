'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Brain, Crown, RotateCcw, ArrowRight } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { generateDailyPuzzle } from '@/lib/puzzle-generator';
import { calculateCompositeScore } from '@/lib/elo';
import GameOrchestrator from '@/components/games/GameOrchestrator';
import type { DailyPuzzleConfig } from '@/lib/puzzle-generator';
import type { DomainScores } from '@/types';

type PagePhase = 'checking' | 'gate' | 'noauth' | 'intro' | 'playing' | 'results';

const DOMAIN_META = [
  { key: 'memory'  as const, label: 'Memory',  icon: '🔢', color: '#8b5cf6' },
  { key: 'speed'   as const, label: 'Speed',   icon: '⚡', color: '#3b82f6' },
  { key: 'pattern' as const, label: 'Pattern', icon: '🎯', color: '#a855f7' },
  { key: 'math'    as const, label: 'Math',    icon: '🧮', color: '#6d28d9' },
  { key: 'stroop'  as const, label: 'Stroop',  icon: '🎭', color: '#7c3aed' },
] as const;

function randomPuzzle(): DailyPuzzleConfig {
  // Use current time to derive a unique seed that won't match any real daily puzzle
  const seed = Date.now() % 999983;
  const mm = String(Math.floor(seed / 10000) % 12 + 1).padStart(2, '0');
  const dd = String(seed % 28 + 1).padStart(2, '0');
  return generateDailyPuzzle(`9999-${mm}-${dd}`, 5);
}

export default function PracticePage() {
  const [phase, setPhase] = useState<PagePhase>('checking');
  const [puzzle, setPuzzle] = useState<DailyPuzzleConfig | null>(null);
  const [scores, setScores] = useState<DomainScores | null>(null);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setPhase('noauth');
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setPhase('noauth');
        return;
      }
      supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          const tier = profile?.subscription_tier;
          setPhase(tier === 'pro' || tier === 'team' ? 'intro' : 'gate');
        });
    });
  }, []);

  const startGame = useCallback(() => {
    setPuzzle(randomPuzzle());
    setScores(null);
    setStartTime(Date.now());
    setPhase('playing');
  }, []);

  function handleComplete(finalScores: DomainScores) {
    setScores(finalScores);
    setPhase('results');
  }

  /* ── Checking ── */
  if (phase === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Brain className="w-8 h-8 animate-pulse text-violet-700" />
      </div>
    );
  }

  /* ── Not authenticated ── */
  if (phase === 'noauth') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
        <Brain className="w-10 h-10 text-violet-400" />
        <div>
          <p className="text-white font-bold text-lg mb-2">Sign in to access Practice Mode</p>
          <p className="text-slate-400 text-sm">Practice Mode is available to Pro subscribers.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/login?next=/practice"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
          >
            Sign in <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 border border-slate-700 rounded-full text-sm font-semibold hover:border-slate-500 text-slate-300 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </div>
    );
  }

  /* ── Pro gate ── */
  if (phase === 'gate') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
          <Crown className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <p className="text-white font-bold text-xl mb-2">Practice Mode is Pro only</p>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Upgrade to Pro to play unlimited randomized puzzles and train your weakest cognitive domains.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/pricing"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-full transition-colors text-sm"
          >
            <Crown className="w-4 h-4" /> Upgrade to Pro — $4.99/mo
          </Link>
          <Link
            href="/play"
            className="px-6 py-3 border border-slate-700 rounded-full text-sm font-semibold hover:border-slate-500 text-slate-300 transition-colors"
          >
            Play today&apos;s challenge instead
          </Link>
        </div>
        <p className="text-slate-600 text-xs">Cancel any time · No commitment</p>
      </div>
    );
  }

  /* ── Intro ── */
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6 text-center">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-8 h-8 text-violet-400" />
            <span className="text-2xl font-bold">Practice Mode</span>
          </div>
          <p className="text-slate-400 text-sm flex items-center justify-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Pro · Unlimited · Random puzzles
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm max-w-xs w-full">
          {[
            ['🔢', 'Memory',  'Recall sequences'],
            ['⚡', 'Speed',   'Tap fast, tap right'],
            ['🎯', 'Pattern', 'Predict the next'],
            ['🧮', 'Math',    'Quick arithmetic'],
            ['🎭', 'Stroop',  'Name the ink color'],
          ].map(([icon, name, desc]) => (
            <div key={name} className="flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-3">
              <span className="text-xl">{icon}</span>
              <div className="text-left">
                <p className="font-semibold text-white text-sm">{name}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={startGame}
          className="bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold px-10 py-4 rounded-full text-lg transition-all"
        >
          Start Practice →
        </button>

        <Link href="/play" className="text-slate-600 text-xs hover:text-slate-400 transition-colors">
          Switch to today&apos;s daily challenge
        </Link>
      </div>
    );
  }

  /* ── Playing ── */
  if (phase === 'playing' && puzzle) {
    return (
      <div className="min-h-screen flex flex-col">
        <GameOrchestrator
          config={puzzle}
          startTime={startTime}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  /* ── Results ── */
  if (phase === 'results' && scores) {
    const total = calculateCompositeScore(scores);
    return (
      <div className="flex flex-col items-center min-h-screen py-12 px-4 gap-8 max-w-lg mx-auto w-full">
        <div className="text-center">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-2 font-medium">Practice result</p>
          <p className="text-7xl font-black text-white tabular-nums">{total}</p>
          <p className="text-slate-500 text-sm mt-1">out of 100</p>
        </div>

        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Breakdown</p>
          {DOMAIN_META.map(({ key, label, icon, color }) => {
            const score = scores[key] ?? 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-base w-5 text-center leading-none">{icon}</span>
                <span className="text-xs font-medium text-slate-400 w-14 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-7 text-right tabular-nums shrink-0">
                  {score}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={startGame}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-2xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Play again
          </button>
          <Link
            href="/play"
            className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            <Brain className="w-4 h-4 text-violet-400" /> Today&apos;s daily challenge
          </Link>
        </div>

        <p className="text-xs text-slate-600">Practice scores are not saved to your ELO or profile.</p>
      </div>
    );
  }

  return null;
}
