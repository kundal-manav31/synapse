'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';
import GameOrchestrator from '@/components/games/GameOrchestrator';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { track } from '@/lib/analytics';
import type { DailyPuzzleConfig } from '@/lib/puzzle-generator';
import type { DomainScores } from '@/types';

type GamePhase = 'loading' | 'intro' | 'countdown' | 'playing' | 'submitting' | 'error';

export default function PlayPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [puzzle, setPuzzle] = useState<DailyPuzzleConfig | null>(null);
  const [puzzleId, setPuzzleId] = useState<string>('');
  const [countdown, setCountdown] = useState(3);
  const [errorMsg, setErrorMsg] = useState('');
  const startTimeRef = useRef<number>(0);

  // Fetch today's puzzle
  useEffect(() => {
    fetch('/api/daily-puzzle')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        if (data.hasPlayedToday) {
          router.replace('/results');
          return;
        }
        setPuzzle(data.puzzle);
        setPuzzleId(data.puzzleId);
        setPhase('intro');
      })
      .catch(err => {
        setErrorMsg(err.message ?? 'Failed to load puzzle');
        setPhase('error');
      });
  }, [router]);

  // Countdown: 3…2…1…GO!
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      startTimeRef.current = Date.now();
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  async function handleGamesComplete(scores: DomainScores, completionTimeMs: number) {
    setPhase('submitting');
    try {
      const res = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, completion_time_ms: completionTimeMs }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.setItem('synapse_result', JSON.stringify({
            scores, completionTimeMs, unauthenticated: true,
          }));
        } else {
          sessionStorage.setItem('synapse_result', JSON.stringify(data));
        }
      } else {
        sessionStorage.setItem('synapse_result', JSON.stringify(data));
        track('game_completed', {
          total_score: data.total_score,
          elo_change: data.elo_change,
          global_rank: data.global_rank,
        });
      }
      router.push('/results');
    } catch {
      // Still go to results with local data
      sessionStorage.setItem('synapse_result', JSON.stringify({
        scores, completionTimeMs, unauthenticated: true,
      }));
      router.push('/results');
    }
  }

  // --- Loading ---
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3 text-slate-400">
        <Brain className="w-6 h-6 text-violet-400 animate-pulse" />
        <span>Loading today&apos;s challenge…</span>
      </div>
    );
  }

  // --- Error ---
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <p className="text-red-400 text-lg font-semibold">{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-violet-600 rounded-full text-sm font-medium hover:bg-violet-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // --- Submitting ---
  if (phase === 'submitting') {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3 text-slate-400">
        <Brain className="w-6 h-6 text-violet-400 animate-spin" />
        <span>Calculating your Brain ELO…</span>
      </div>
    );
  }

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6 text-center">
        <div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="w-8 h-8 text-violet-400" />
            <span className="text-2xl font-bold">SYNAPSE</span>
          </div>
          <p className="text-slate-400 text-lg">
            Today&apos;s Challenge
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-400 max-w-xs w-full">
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
          onClick={() => { track('game_started'); setCountdown(3); setPhase('countdown'); }}
          className="bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold px-10 py-4 rounded-full text-lg transition-all"
        >
          I&apos;m Ready →
        </button>

        <p className="text-slate-600 text-xs">Takes about 2 minutes</p>
      </div>
    );
  }

  // --- Countdown ---
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <p className="text-slate-400 uppercase tracking-widest text-sm font-medium">Get ready</p>
        <div className="text-9xl font-black text-violet-400 tabular-nums transition-all duration-300 scale-100">
          {countdown === 0 ? 'GO!' : countdown}
        </div>
      </div>
    );
  }

  // --- Playing ---
  if (phase === 'playing' && puzzle) {
    return (
      <div className="min-h-screen flex flex-col">
        <ErrorBoundary>
          <GameOrchestrator
            config={puzzle}
            startTime={startTimeRef.current}
            onComplete={handleGamesComplete}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return null;
}
