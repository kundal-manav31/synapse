'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Brain, ArrowRight, Crown, CheckCircle, ExternalLink } from 'lucide-react';
import { Suspense } from 'react';
import { getEloTier } from '@/lib/elo';
import BrainRadar from '@/components/ui/BrainRadar';
import EloDisplay from '@/components/ui/EloDisplay';
import StreakBadge from '@/components/ui/StreakBadge';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import type { Profile } from '@/types';

interface Session {
  puzzle_date: string;
  elo_after: number | null;
  total_score: number | null;
  memory_score: number | null;
  speed_score: number | null;
  pattern_score: number | null;
  math_score: number | null;
  stroop_score: number | null;
}

interface PersonalBests {
  memory: number;
  speed: number;
  pattern: number;
  math: number;
  stroop: number;
}

interface ProfileData {
  profile: Profile;
  sessions: Session[];
  personalBests: PersonalBests;
  playedDates: string[];
}

const DOMAIN_META = [
  { key: 'memory'  as const, label: 'Memory',  icon: '🔢', color: '#8b5cf6' },
  { key: 'speed'   as const, label: 'Speed',   icon: '⚡', color: '#3b82f6' },
  { key: 'pattern' as const, label: 'Pattern', icon: '🎯', color: '#a855f7' },
  { key: 'math'    as const, label: 'Math',    icon: '🧮', color: '#6d28d9' },
  { key: 'stroop'  as const, label: 'Stroop',  icon: '🎭', color: '#7c3aed' },
] as const;

function TierBadge({ elo }: { elo: number }) {
  const tier = getEloTier(elo);
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ color: tier.color, background: `${tier.color}22`, border: `1px solid ${tier.color}44` }}
    >
      {tier.emoji} {tier.tier}
    </span>
  );
}

function SubBadge({ tier }: { tier: string }) {
  if (tier === 'free') return null;
  const isPro = tier === 'pro';
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
      isPro
        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
    }`}>
      <Crown className="w-3 h-3" />
      {isPro ? 'Pro' : 'Team'}
    </span>
  );
}

function ProfileContent() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAuth, setNotAuth] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded') === 'true';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.status === 401) { setNotAuth(true); return; }
        if (res.status === 503) { setNotAuth(true); return; }
        if (!res.ok) return;
        setData(await res.json() as ProfileData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Loading ── */
  if (loading) {
    return <ProfileSkeleton />;
  }

  /* ── Unauthenticated ── */
  if (notAuth || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
        <Brain className="w-10 h-10 text-violet-400" />
        <div>
          <p className="text-white font-semibold text-lg mb-2">Sign in to view your profile</p>
          <p className="text-slate-400 text-sm">Track your Brain ELO, streaks, and cognitive breakdown.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Create account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-slate-700 rounded-full text-sm font-semibold hover:border-slate-500 text-slate-300 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const { profile, sessions, personalBests, playedDates } = data;
  const tier = getEloTier(profile.elo);
  const displayName = profile.display_name ?? profile.username;

  // Average scores across all sessions for the radar chart
  const avgScores = { memory: 0, speed: 0, pattern: 0, math: 0, stroop: 0 };
  if (sessions.length) {
    for (const s of sessions) {
      avgScores.memory  += s.memory_score  ?? 0;
      avgScores.speed   += s.speed_score   ?? 0;
      avgScores.pattern += s.pattern_score ?? 0;
      avgScores.math    += s.math_score    ?? 0;
      avgScores.stroop  += s.stroop_score  ?? 0;
    }
    const n = sessions.length;
    avgScores.memory  = Math.round(avgScores.memory  / n);
    avgScores.speed   = Math.round(avgScores.speed   / n);
    avgScores.pattern = Math.round(avgScores.pattern / n);
    avgScores.math    = Math.round(avgScores.math    / n);
    avgScores.stroop  = Math.round(avgScores.stroop  / n);
  }

  // ELO history for line chart
  const eloHistory = sessions
    .filter(s => s.elo_after !== null)
    .map(s => ({ date: s.puzzle_date, elo: s.elo_after! }));

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/lemonsqueezy/portal', { method: 'POST' });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 gap-6 max-w-xl mx-auto w-full">

      {/* ── Upgrade success banner ── */}
      {upgraded && (
        <div className="w-full flex items-center gap-3 bg-green-950/40 border border-green-700/40 rounded-2xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-green-300 font-bold text-sm">Welcome to Pro!</p>
            <p className="text-slate-400 text-xs">Practice mode and extended analytics are now unlocked.</p>
          </div>
        </div>
      )}

      {/* ── Profile header ── */}
      <div className="w-full flex items-center gap-4">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={displayName}
            width={56}
            height={56}
            className="rounded-full object-cover w-14 h-14"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-violet-900/60 flex items-center justify-center text-violet-300 text-xl font-black shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xl font-black text-white truncate">{displayName}</p>
          <p className="text-slate-500 text-xs">@{profile.username}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <TierBadge elo={profile.elo} />
            <SubBadge tier={profile.subscription_tier} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-black text-white">{profile.elo.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Brain ELO</p>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="w-full grid grid-cols-3 gap-3">
        {[
          { label: 'Games played', value: sessions.length },
          { label: 'Current streak', value: `🔥 ${profile.streak_current}` },
          { label: 'Best streak', value: profile.streak_longest },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Brain Radar ── */}
      {sessions.length > 0 && (
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Cognitive profile
          </p>
          <p className="text-[11px] text-slate-600 mb-3">Average across {sessions.length} games</p>
          <BrainRadar scores={avgScores} />
        </div>
      )}

      {/* ── ELO History ── */}
      {eloHistory.length > 1 && (
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            ELO history
          </p>
          <EloDisplay history={eloHistory} />
        </div>
      )}

      {/* ── Streak calendar ── */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Activity (last 13 weeks)
        </p>
        <StreakBadge
          playedDates={playedDates}
          currentStreak={profile.streak_current}
          longestStreak={profile.streak_longest}
        />
      </div>

      {/* ── Personal bests ── */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Personal bests
        </p>
        <div className="flex flex-col gap-3">
          {DOMAIN_META.map(({ key, label, icon, color }) => {
            const best = personalBests[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-base w-5 text-center leading-none">{icon}</span>
                <span className="text-xs font-medium text-slate-400 w-14 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${best}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-7 text-right tabular-nums shrink-0">
                  {best}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── No games yet ── */}
      {sessions.length === 0 && (
        <div className="w-full text-center bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-10">
          <Brain className="w-8 h-8 text-violet-700 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No games played yet</p>
          <p className="text-slate-500 text-sm mb-4">Complete today&apos;s challenge to start building your profile.</p>
          <Link
            href="/play"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
          >
            Play now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Upgrade nudge (free users) ── */}
      {profile.subscription_tier === 'free' && sessions.length > 0 && (
        <div className="w-full text-center bg-amber-950/30 border border-amber-800/40 rounded-2xl px-6 py-5">
          <p className="text-amber-300 font-bold mb-1">Unlock Pro features</p>
          <p className="text-slate-400 text-sm mb-3">
            Unlimited practice, extended history, and weekly Brain Reports.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full transition-colors text-sm"
          >
            <Crown className="w-4 h-4" /> Upgrade to Pro — $4.99/mo
          </Link>
        </div>
      )}

      {/* ── Manage subscription (paid users) ── */}
      {profile.subscription_tier !== 'free' && (
        <div className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-4">
          <div>
            <p className="text-white font-semibold text-sm">
              {profile.subscription_tier === 'team' ? 'Team' : 'Pro'} subscription active
            </p>
            <p className="text-slate-500 text-xs mt-0.5">Manage billing, cancel, or change plan</p>
          </div>
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
          >
            {portalLoading ? 'Opening…' : 'Manage'}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
