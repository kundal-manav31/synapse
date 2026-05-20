'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Brain, Trophy, ArrowRight } from 'lucide-react';
import { calculateCompositeScore, getEloTier } from '@/lib/elo';
import ResultCard from '@/components/ui/ResultCard';
import Countdown from '@/components/ui/Countdown';

/* ─── Types ─────────────────────────────────────────────────────────── */

interface ResultData {
  scores?: { memory: number; speed: number; pattern: number; math: number; stroop: number };
  total_score?: number;
  elo_before?: number;
  elo_after?: number;
  elo_change?: number;
  global_rank?: number;
  percentile?: number;
  streak?: number;
  unauthenticated?: boolean;
  completionTimeMs?: number;
}

const DOMAIN_META = [
  { key: 'memory'  as const, label: 'Memory',  icon: '🔢', color: '#8b5cf6' },
  { key: 'speed'   as const, label: 'Speed',   icon: '⚡', color: '#3b82f6' },
  { key: 'pattern' as const, label: 'Pattern', icon: '🎯', color: '#a855f7' },
  { key: 'math'    as const, label: 'Math',    icon: '🧮', color: '#6d28d9' },
  { key: 'stroop'  as const, label: 'Stroop',  icon: '🎭', color: '#7c3aed' },
] as const;

/* ─── ELO count-up hook ─────────────────────────────────────────────── */

function useCountUp(target: number, from: number, durationMs = 1400): number {
  const [value, setValue] = useState(from);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setValue(from);
    if (from === target) return;

    const start = performance.now();
    const range = target - from;

    function tick(now: number) {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setValue(Math.round(from + range * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, from, durationMs]);

  return value;
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function ResultsPage() {
  const [result, setResult] = useState<ResultData | null>(null);
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('synapse_result');
    if (raw) {
      try { setResult(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  // Trigger bar animation a beat after data loads
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setBarsReady(true), 400);
    return () => clearTimeout(t);
  }, [result]);

  /* ── Empty state ── */
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
        <Brain className="w-10 h-10 text-violet-400" />
        <div>
          <p className="text-white font-semibold text-lg mb-2">No results yet</p>
          <p className="text-slate-400 text-sm">Complete today&apos;s challenge to see your Brain ELO.</p>
        </div>
        <Link
          href="/play"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Play Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  /* ── Derived values ── */
  const scores = result.scores ?? { memory: 0, speed: 0, pattern: 0, math: 0, stroop: 0 };
  const totalScore   = result.total_score  ?? calculateCompositeScore(scores);
  const eloBefore    = result.elo_before   ?? 1000;
  const eloAfter     = result.elo_after    ?? 1000;
  const eloChange    = result.elo_change   ?? 0;
  const tier         = getEloTier(eloAfter);

  // Animated ELO value
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedElo = useCountUp(eloAfter, eloBefore);

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 gap-8 max-w-lg mx-auto w-full">

      {/* ── Nav ── */}
      <div className="flex items-center gap-2 text-slate-500 text-xs self-start">
        <Brain className="w-3.5 h-3.5 text-violet-400" />
        <span>SYNAPSE · Today&apos;s Results</span>
      </div>

      {/* ── Brain ELO (animated count-up) ── */}
      <div className="text-center">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">Brain ELO</p>
        <div className="flex items-end justify-center gap-3">
          <span className="text-7xl font-black text-white tabular-nums leading-none">
            {animatedElo.toLocaleString()}
          </span>
          <div className="mb-2">
            <span className={`text-2xl font-bold ${eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {eloChange >= 0 ? '+' : ''}{eloChange}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-2xl">{tier.emoji}</span>
          <span className="font-bold text-lg" style={{ color: tier.color }}>
            {tier.tier}
          </span>
        </div>
      </div>

      {/* ── Stats row (authenticated only) ── */}
      {!result.unauthenticated && result.global_rank && (
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-center">
          <div>
            <p className="text-2xl font-black text-white">
              #{result.global_rank.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Global rank</p>
          </div>
          <div className="w-px bg-slate-800 hidden sm:block self-stretch" />
          <div>
            <p className="text-2xl font-black text-white">Top {result.percentile}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Globally today</p>
          </div>
          <div className="w-px bg-slate-800 hidden sm:block self-stretch" />
          <div>
            <p className="text-2xl font-black text-white">{totalScore}/100</p>
            <p className="text-xs text-slate-500 mt-0.5">Total score</p>
          </div>
          {result.streak && result.streak > 0 && (
            <>
              <div className="w-px bg-slate-800 hidden sm:block self-stretch" />
              <div>
                <p className="text-2xl font-black text-orange-400">
                  🔥 {result.streak}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Day streak</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Sign-up nudge (unauthenticated) ── */}
      {result.unauthenticated && (
        <div className="w-full text-center bg-violet-950/30 border border-violet-800/50 rounded-2xl px-6 py-5">
          <p className="text-violet-300 font-bold text-lg mb-1">Sign up to save your score</p>
          <p className="text-slate-400 text-sm mb-4">
            You scored <strong className="text-white">{totalScore}/100</strong> — create an account to track your Brain ELO.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-violet-600 rounded-full text-sm font-bold hover:bg-violet-500 transition-colors"
            >
              Create account free
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 border border-slate-700 rounded-full text-sm font-semibold hover:border-slate-500 text-slate-300 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── Domain breakdown (staggered bars) ── */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Cognitive breakdown
        </p>
        {DOMAIN_META.map(({ key, label, icon, color }, i) => {
          const score = scores[key] ?? 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-base w-5 text-center leading-none">{icon}</span>
              <span className="text-xs font-medium text-slate-400 w-14 shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: barsReady ? `${score}%` : '0%',
                    backgroundColor: color,
                    transition: `width 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
                  }}
                />
              </div>
              <span className="text-sm font-bold text-white w-7 text-right tabular-nums shrink-0">
                {score}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Result Card (shareable) ── */}
      <div className="w-full flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest self-start">
          Share your result
        </p>
        <ResultCard
          scores={scores}
          totalScore={totalScore}
          eloBefore={eloBefore}
          eloAfter={eloAfter}
          eloChange={eloChange}
          globalRank={result.global_rank}
          percentile={result.percentile}
          streak={result.streak}
        />
      </div>

      {/* ── Countdown + CTA ── */}
      <div className="w-full flex flex-col items-center gap-4 pb-6">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Next challenge in</p>
          <p className="text-3xl font-black text-violet-400">
            <Countdown />
          </p>
        </div>

        <Link
          href="/leaderboard"
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl text-sm font-semibold text-slate-300 transition-all"
        >
          <Trophy className="w-4 h-4 text-slate-400" />
          View global leaderboard
        </Link>
      </div>
    </div>
  );
}
