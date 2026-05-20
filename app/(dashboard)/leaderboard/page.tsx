'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Trophy, Users, RefreshCw } from 'lucide-react';
import { getEloTier } from '@/lib/elo';
import { LeaderboardSkeleton } from '@/components/ui/Skeleton';
import type { LeaderboardEntry } from '@/types';

type Tab = 'global' | 'friends';

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={32}
        height={32}
        className="rounded-full object-cover w-8 h-8"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-violet-900/60 flex items-center justify-center text-violet-300 text-xs font-bold shrink-0">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="text-sm font-bold text-slate-400 tabular-nums w-7 text-right">
      #{rank ?? '—'}
    </span>
  );
}

function EntryRow({
  entry,
  isMe,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
}) {
  const tier = getEloTier(entry.elo ?? 1000);
  const displayName = entry.display_name ?? entry.username;

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
        isMe
          ? 'bg-violet-950/60 border border-violet-700/50'
          : 'hover:bg-slate-800/40',
      ].join(' ')}
    >
      <div className="w-9 flex items-center justify-center shrink-0">
        <RankBadge rank={entry.global_rank} />
      </div>

      <Avatar url={entry.avatar_url} name={displayName} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white truncate">{displayName}</span>
          {isMe && (
            <span className="text-[10px] bg-violet-700 text-violet-200 rounded px-1.5 py-0.5 font-bold shrink-0">
              YOU
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span style={{ color: tier.color }}>{tier.emoji} {tier.tier}</span>
          {entry.streak_current > 1 && (
            <span className="text-orange-400">🔥 {entry.streak_current}</span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-black text-white tabular-nums">{entry.total_score}/100</div>
        <div className="text-[11px] text-slate-500 tabular-nums">
          {(entry.elo ?? 1000).toLocaleString()} ELO
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('global');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const channelRef = useRef<{ unsubscribe: () => void } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?date=${today}`);
      if (res.ok) {
        const json = await res.json() as LeaderboardResponse;
        setData(json);
        if (json.myEntry) setMyUsername(json.myEntry.username);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();

    // Real-time subscription — refetch when a new score comes in today
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const isConfigured = supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://');
    if (!isConfigured) return;

    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const channel = supabase
          .channel('leaderboard-live')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'game_sessions', filter: `puzzle_date=eq.${today}` },
            () => { fetchLeaderboard(); }
          )
          .subscribe();
        channelRef.current = channel;
      } catch { /* ignore */ }
    })();

    return () => {
      channelRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = data?.entries ?? [];
  const myEntry = data?.myEntry ?? null;
  const myInTop = myEntry
    ? entries.some(e => e.username === myEntry.username)
    : false;

  const today_display = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 max-w-xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center gap-3 mb-1 self-start">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h1 className="text-xl font-black text-white">Leaderboard</h1>
      </div>
      <p className="text-slate-500 text-xs self-start mb-6">{today_display}</p>

      {/* Tabs */}
      <div className="flex w-full bg-slate-900/60 border border-slate-800 rounded-xl p-1 gap-1 mb-6">
        {(['global', 'friends'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors',
              tab === t
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {t === 'global'
              ? <><Trophy className="w-3.5 h-3.5" /> Global</>
              : <><Users className="w-3.5 h-3.5" /> Friends</>
            }
          </button>
        ))}
      </div>

      {/* Friends placeholder */}
      {tab === 'friends' && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Users className="w-10 h-10 text-slate-700" />
          <div>
            <p className="text-white font-semibold mb-1">Friends coming soon</p>
            <p className="text-slate-500 text-sm max-w-xs">
              Challenge friends and compare Brain ELO head-to-head. Share your result card to invite them.
            </p>
          </div>
        </div>
      )}

      {/* Global leaderboard */}
      {tab === 'global' && (
        <>
          {loading && !data ? (
            <LeaderboardSkeleton />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Trophy className="w-10 h-10 text-slate-700" />
              <div>
                <p className="text-white font-semibold mb-1">No scores yet today</p>
                <p className="text-slate-500 text-sm">Be the first to set the pace!</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-0.5">
              {entries.map(entry => (
                <EntryRow
                  key={entry.username}
                  entry={entry}
                  isMe={!!myUsername && entry.username === myUsername}
                />
              ))}
            </div>
          )}

          {/* Current user sticky footer — shown when not in top 100 */}
          {myEntry && !myInTop && (
            <div className="w-full mt-4 border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500 mb-2">Your position today</p>
              <EntryRow entry={myEntry} isMe />
            </div>
          )}

          {/* Live badge + refresh */}
          <div className="flex items-center gap-2 mt-5 text-xs text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Live updates</span>
            <button
              onClick={fetchLeaderboard}
              className="ml-2 flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}
